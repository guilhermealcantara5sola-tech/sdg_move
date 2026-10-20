package com.tresletras.move

import android.accessibilityservice.AccessibilityService
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.Ringtone
import android.media.RingtoneManager
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.VibrationEffect
import android.os.Vibrator
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.modules.core.DeviceEventManagerModule

class AutoAcceptAccessibilityService : AccessibilityService() {

    companion object {
        private const val TAG = "AutoAcceptService"
        var isServiceRunning = false
            private set
        var reactContext: ReactContext? = null
    }

    private var lastHandledTimestamp: Long = 0
    private var lastHandledPrice: Double = 0.0
    private var activeRingtone: Ringtone? = null

    override fun onServiceConnected() {
        super.onServiceConnected()
        isServiceRunning = true
        Log.d(TAG, "AutoAcceptAccessibilityService ativado e escutando eventos!")
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return

        val prefs = getSharedPreferences("tl_moveis_prefs", Context.MODE_PRIVATE)
        val isEnabled = prefs.getBoolean("key_enabled", true)
        if (!isEnabled) return

        val minPrice = prefs.getFloat("key_min_price", 20.0f).toDouble()
        val minKmRate = prefs.getFloat("key_min_km_rate", 0.0f).toDouble()
        val targetPackage = prefs.getString("key_target_package", "") ?: ""
        val keywordsRaw = prefs.getString("key_keywords", "Aceitar,ACEITAR,Confirmar,PEGAR,Toque para aceitar") ?: ""
        val keywords = keywordsRaw.split(",").map { it.trim() }.filter { it.isNotEmpty() }
        val useRoot = prefs.getBoolean("key_use_root", false)

        val customViewId = prefs.getString("key_view_id", "") ?: ""
        val customPriceRegex = prefs.getString("key_price_regex", "") ?: ""

        val currentPackage = event.packageName?.toString() ?: ""
        if (targetPackage.isNotBlank() && currentPackage != targetPackage) {
            return
        }

        val startTime = System.currentTimeMillis()
        val rootNode = rootInActiveWindow ?: return

        try {
            val parsed = RideOfferParser.parseTree(rootNode, keywords, customViewId, customPriceRegex)

            if (parsed.prices.isNotEmpty() && parsed.acceptNodes.isNotEmpty()) {
                val detectedPrice = parsed.prices.maxOrNull() ?: 0.0
                val detectedKm = parsed.distances.firstOrNull()

                val now = System.currentTimeMillis()
                if (now - lastHandledTimestamp < 2500 && detectedPrice == lastHandledPrice) {
                    return
                }

                val kmRate = if (detectedKm != null && detectedKm > 0) detectedPrice / detectedKm else null
                val meetsPrice = detectedPrice >= minPrice
                val meetsKmRate = if (minKmRate > 0 && kmRate != null) kmRate >= minKmRate else true

                if (meetsPrice && meetsKmRate) {
                    val acceptButton = parsed.acceptNodes.first()
                    val forceSwipe = prefs.getBoolean("key_force_swipe", false)
                    val clicked = ClickExecutor.executeAcceptAction(this, acceptButton, useRoot, forceSwipe)
                    val elapsed = System.currentTimeMillis() - startTime

                    lastHandledTimestamp = now
                    lastHandledPrice = detectedPrice

                    val playCallSound = prefs.getBoolean("key_call_sound", true)
                    if (playCallSound) {
                        triggerCallAlert()
                    }
                    notifyOverlay(detectedPrice, true)
                    emitJSEvent("onRideProcessed", detectedPrice, true, elapsed)

                } else {
                    if (now - lastHandledTimestamp > 2500 || detectedPrice != lastHandledPrice) {
                        lastHandledTimestamp = now
                        lastHandledPrice = detectedPrice
                        notifyOverlay(detectedPrice, false)
                        emitJSEvent("onRideProcessed", detectedPrice, false, 0)
                    }
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao analisar tela", e)
        }
    }

    private fun notifyOverlay(price: Double, accepted: Boolean) {
        val intent = Intent(this, FloatingOverlayService::class.java).apply {
            action = FloatingOverlayService.ACTION_UPDATE_STATUS
            putExtra(FloatingOverlayService.EXTRA_PRICE, price)
            putExtra(FloatingOverlayService.EXTRA_ACCEPTED, accepted)
        }
        startService(intent)
    }

    private fun emitJSEvent(eventName: String, price: Double, accepted: Boolean, elapsedMs: Long) {
        reactContext?.let { context ->
            if (context.hasActiveReactInstance()) {
                val params = Arguments.createMap().apply {
                    putDouble("price", price)
                    putBoolean("accepted", accepted)
                    putDouble("elapsedMs", elapsedMs.toDouble())
                    putDouble("timestamp", System.currentTimeMillis().toDouble())
                }
                context.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    ?.emit(eventName, params)
            }
        }
    }

    private fun triggerCallAlert() {
        try {
            val ringtoneUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)
                ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
                ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)

            activeRingtone?.stop()
            activeRingtone = RingtoneManager.getRingtone(applicationContext, ringtoneUri)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                activeRingtone?.audioAttributes = AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build()
            }
            activeRingtone?.play()

            // Padrão de vibração de chamada telefônica (vibra 800ms, pausa 400ms, repete 3x)
            val vibrator = getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val timings = longArrayOf(0, 800, 400, 800, 400, 800)
                val amplitudes = intArrayOf(0, 255, 0, 255, 0, 255)
                vibrator?.vibrate(VibrationEffect.createWaveform(timings, amplitudes, -1))
            } else {
                @Suppress("DEPRECATION")
                vibrator?.vibrate(longArrayOf(0, 800, 400, 800, 400, 800), -1)
            }

            // Para o toque de chamada automaticamente após 6 segundos
            Handler(Looper.getMainLooper()).postDelayed({
                try {
                    activeRingtone?.stop()
                    activeRingtone = null
                } catch (e: Exception) {}
            }, 6000)

        } catch (e: Exception) {
            Log.e(TAG, "Erro ao disparar toque de chamada", e)
        }
    }

    override fun onInterrupt() {}

    override fun onDestroy() {
        super.onDestroy()
        isServiceRunning = false
        try {
            activeRingtone?.stop()
            activeRingtone = null
        } catch (e: Exception) {}
    }
}

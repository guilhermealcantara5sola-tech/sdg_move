package com.tresletras.move

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap

class AutoAcceptModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    init {
        // Conecta o contexto do React Native com o serviço de acessibilidade
        AutoAcceptAccessibilityService.reactContext = reactContext
    }

    override fun getName(): String = "AutoAcceptBridge"

    @ReactMethod
    fun openAccessibilitySettings() {
        val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        reactContext.startActivity(intent)
    }

    @ReactMethod
    fun openOverlaySettings() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val intent = Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:${reactContext.packageName}")
            ).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            reactContext.startActivity(intent)
        }
    }

    @ReactMethod
    fun checkPermissions(promise: Promise) {
        val hasOverlay = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Settings.canDrawOverlays(reactContext)
        } else {
            true
        }
        val isAccessibility = AutoAcceptAccessibilityService.isServiceRunning
        val isRoot = RootHelper.isRootAvailable()

        val map = com.facebook.react.bridge.Arguments.createMap().apply {
            putBoolean("hasOverlay", hasOverlay)
            putBoolean("isAccessibilityActive", isAccessibility)
            putBoolean("isRootAvailable", isRoot)
            putBoolean("isOverlayRunning", FloatingOverlayService.isOverlayRunning)
        }
        promise.resolve(map)
    }

    @ReactMethod
    fun updateConfig(config: ReadableMap) {
        val prefs = reactContext.getSharedPreferences("tl_moveis_prefs", Context.MODE_PRIVATE)
        val editor = prefs.edit()

        if (config.hasKey("minPrice")) {
            editor.putFloat("key_min_price", config.getDouble("minPrice").toFloat())
        }
        if (config.hasKey("minKmRate")) {
            editor.putFloat("key_min_km_rate", config.getDouble("minKmRate").toFloat())
        }
        if (config.hasKey("isEnabled")) {
            editor.putBoolean("key_enabled", config.getBoolean("isEnabled"))
        }
        if (config.hasKey("targetPackage")) {
            editor.putString("key_target_package", config.getString("targetPackage"))
        }
        if (config.hasKey("keywords")) {
            editor.putString("key_keywords", config.getString("keywords"))
        }
        if (config.hasKey("useRootClick")) {
            editor.putBoolean("key_use_root", config.getBoolean("useRootClick"))
        }
        if (config.hasKey("forceSwipe")) {
            editor.putBoolean("key_force_swipe", config.getBoolean("forceSwipe"))
        }
        if (config.hasKey("viewId")) {
            editor.putString("key_view_id", config.getString("viewId"))
        }
        if (config.hasKey("playCallSound")) {
            editor.putBoolean("key_call_sound", config.getBoolean("playCallSound"))
        }
        if (config.hasKey("priceRegex")) {
            editor.putString("key_price_regex", config.getString("priceRegex"))
        }
        editor.apply()
    }

    @ReactMethod
    fun startFloatingHUD() {
        val intent = Intent(reactContext, FloatingOverlayService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            reactContext.startForegroundService(intent)
        } else {
            reactContext.startService(intent)
        }
    }

    @ReactMethod
    fun stopFloatingHUD() {
        val intent = Intent(reactContext, FloatingOverlayService::class.java)
        reactContext.stopService(intent)
    }
}

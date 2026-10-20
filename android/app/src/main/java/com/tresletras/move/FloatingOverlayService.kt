package com.tresletras.move

import android.annotation.SuppressLint
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.IBinder
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.widget.LinearLayout
import android.widget.TextView
import androidx.core.app.NotificationCompat

class FloatingOverlayService : Service() {

    companion object {
        const val ACTION_UPDATE_STATUS = "action_update_status"
        const val EXTRA_PRICE = "extra_price"
        const val EXTRA_ACCEPTED = "extra_accepted"
        var isOverlayRunning = false
            private set
    }

    private lateinit var windowManager: WindowManager
    private var overlayLayout: LinearLayout? = null
    private lateinit var layoutParams: WindowManager.LayoutParams

    private var tvStatus: TextView? = null
    private var tvPrice: TextView? = null
    private var statusDot: View? = null

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager
        startForegroundNotification()
        buildHUDView()
        isOverlayRunning = true
    }

    private fun startForegroundNotification() {
        val channelId = "tl_floating_channel"
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "Monitor Flutuante TL",
                NotificationManager.IMPORTANCE_LOW
            )
            val mgr = getSystemService(NotificationManager::class.java)
            mgr?.createNotificationChannel(channel)
        }

        val notification: Notification = NotificationCompat.Builder(this, channelId)
            .setContentTitle("Três Letras Move")
            .setContentText("Monitor de tela em tempo real ativo")
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .build()

        startForeground(1002, notification)
    }

    @SuppressLint("ClickableViewAccessibility", "SetTextI18n")
    private fun buildHUDView() {
        val layoutFlag = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
            @Suppress("DEPRECATION")
            WindowManager.LayoutParams.TYPE_PHONE
        }

        layoutParams = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            layoutFlag,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            x = 60
            y = 220
        }

        val container = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(24, 16, 24, 16)
            background = GradientDrawable().apply {
                setColor(Color.parseColor("#F2111827")) // Slate 900 dark translucent
                cornerRadius = 32f
                setStroke(2, Color.parseColor("#06B6D4")) // Neon Cyan border
            }
        }

        statusDot = View(this).apply {
            val dotParams = LinearLayout.LayoutParams(24, 24).apply {
                marginEnd = 16
            }
            layoutParams = dotParams
            background = GradientDrawable().apply {
                shape = GradientDrawable.OVAL
                setColor(Color.parseColor("#10B981")) // Green
            }
        }
        container.addView(statusDot)

        val textLayout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
        }

        tvStatus = TextView(this).apply {
            text = "TL MONITOR"
            setTextColor(Color.WHITE)
            textSize = 11f
        }
        textLayout.addView(tvStatus)

        tvPrice = TextView(this).apply {
            text = "Pronto"
            setTextColor(Color.parseColor("#06B6D4"))
            textSize = 13f
        }
        textLayout.addView(tvPrice)

        container.addView(textLayout)

        // Arrastar na tela
        container.setOnTouchListener(object : View.OnTouchListener {
            private var initX = 0
            private var initY = 0
            private var touchX = 0f
            private var touchY = 0f

            override fun onTouch(v: View?, event: MotionEvent?): Boolean {
                if (event == null) return false
                when (event.action) {
                    MotionEvent.ACTION_DOWN -> {
                        initX = layoutParams.x
                        initY = layoutParams.y
                        touchX = event.rawX
                        touchY = event.rawY
                        return true
                    }
                    MotionEvent.ACTION_MOVE -> {
                        layoutParams.x = initX + (event.rawX - touchX).toInt()
                        layoutParams.y = initY + (event.rawY - touchY).toInt()
                        overlayLayout?.let { windowManager.updateViewLayout(it, layoutParams) }
                        return true
                    }
                }
                return false
            }
        })

        overlayLayout = container
        windowManager.addView(overlayLayout, layoutParams)
    }

    @SuppressLint("SetTextI18n")
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_UPDATE_STATUS) {
            val accepted = intent.getBooleanExtra(EXTRA_ACCEPTED, false)
            val price = intent.getDoubleExtra(EXTRA_PRICE, 0.0)

            if (accepted) {
                tvPrice?.text = String.format("⚡ ACEITO: R$ %.2f", price)
                tvPrice?.setTextColor(Color.parseColor("#10B981"))
            } else {
                tvPrice?.text = String.format("🛑 IGNORADO: R$ %.2f", price)
                tvPrice?.setTextColor(Color.parseColor("#EF4444"))
            }
        }
        return START_STICKY
    }

    override fun onDestroy() {
        super.onDestroy()
        isOverlayRunning = false
        try {
            overlayLayout?.let {
                windowManager.removeView(it)
                overlayLayout = null
            }
        } catch (e: Exception) {}
    }
}

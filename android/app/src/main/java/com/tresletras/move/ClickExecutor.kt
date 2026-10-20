package com.tresletras.move

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.graphics.Path
import android.graphics.Rect
import android.os.Build
import android.util.Log
import android.view.accessibility.AccessibilityNodeInfo

object ClickExecutor {

    private const val TAG = "ClickExecutor"

    /**
     * Executa a ação de aceite no botão detectado (seja onde for que ele apareça na tela).
     * Suporta clique direto, gesto em coordenadas dinâmicas e swipe horizontal se necessário.
     */
    fun executeAcceptAction(
        service: AccessibilityService,
        node: AccessibilityNodeInfo,
        useRoot: Boolean,
        forceSwipe: Boolean = false
    ): Boolean {
        val rect = Rect()
        node.getBoundsInScreen(rect)

        val centerX = rect.centerX()
        val centerY = rect.centerY()
        val text = (node.text?.toString() ?: node.contentDescription?.toString() ?: "").lowercase()

        val isSwipeButton = forceSwipe || text.contains("deslize") || text.contains("arraste") || text.contains("slide")

        Log.d(TAG, "Botão detectado dinamicamente em [${rect.left}, ${rect.top}, ${rect.right}, ${rect.bottom}]. Modo Swipe: $isSwipeButton")

        if (isSwipeButton) {
            val startX = (rect.left + 60).toFloat()
            val endX = (rect.right - 60).coerceAtLeast(rect.left + 200).toFloat()
            val y = centerY.toFloat()
            return swipe(service, startX, y, endX, y, useRoot)
        }

        // 1. Tentar clique no nó ou em seus pais diretamente na árvore de acessibilidade
        var target: AccessibilityNodeInfo? = node
        while (target != null) {
            if (target.isClickable) {
                if (target.performAction(AccessibilityNodeInfo.ACTION_CLICK)) {
                    Log.d(TAG, "Ação ACTION_CLICK executada com sucesso no nó da tela!")
                    return true
                }
            }
            target = target.parent
        }

        // 2. Se configurado para modo Superusuário / Root, injeta toque físico no centro do botão
        if (useRoot && RootHelper.isRootAvailable()) {
            val rootSuccess = RootHelper.tap(centerX, centerY)
            if (rootSuccess) {
                Log.d(TAG, "Toque disparado via Root com sucesso em ($centerX, $centerY)")
                return true
            }
        }

        // 3. Fallback: Disparar Gesto de Toque instantâneo nas coordenadas exatas onde o botão está
        return clickViaGesture(service, centerX.toFloat(), centerY.toFloat())
    }

    private fun clickViaGesture(service: AccessibilityService, x: Float, y: Float): Boolean {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            val clickPath = Path().apply { moveTo(x, y) }
            val stroke = GestureDescription.StrokeDescription(clickPath, 0, 50)
            val gesture = GestureDescription.Builder().addStroke(stroke).build()
            return service.dispatchGesture(gesture, null, null)
        }
        return false
    }

    private fun swipe(
        service: AccessibilityService,
        startX: Float,
        startY: Float,
        endX: Float,
        endY: Float,
        useRoot: Boolean
    ): Boolean {
        if (useRoot && RootHelper.isRootAvailable()) {
            val cmd = "input swipe ${startX.toInt()} ${startY.toInt()} ${endX.toInt()} ${endY.toInt()} 200"
            try {
                val p = Runtime.getRuntime().exec(arrayOf("su", "-c", cmd))
                if (p.waitFor() == 0) return true
            } catch (e: Exception) {}
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            val swipePath = Path().apply {
                moveTo(startX, startY)
                lineTo(endX, endY)
            }
            val stroke = GestureDescription.StrokeDescription(swipePath, 0, 200)
            val gesture = GestureDescription.Builder().addStroke(stroke).build()
            return service.dispatchGesture(gesture, null, null)
        }
        return false
    }
}

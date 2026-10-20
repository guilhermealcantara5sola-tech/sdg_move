package com.tresletras.move

import java.io.DataOutputStream
import java.io.File

object RootHelper {

    fun isRootAvailable(): Boolean {
        val paths = arrayOf(
            "/system/bin/su",
            "/system/xbin/su",
            "/sbin/su",
            "/system/su",
            "/system/bin/.ext/.su"
        )
        for (path in paths) {
            if (File(path).exists()) return true
        }
        return try {
            val p = Runtime.getRuntime().exec(arrayOf("su", "-c", "echo 1"))
            p.waitFor() == 0
        } catch (e: Exception) {
            false
        }
    }

    fun tap(x: Int, y: Int): Boolean {
        return try {
            val process = Runtime.getRuntime().exec("su")
            DataOutputStream(process.outputStream).use { os ->
                os.writeBytes("input tap $x $y\n")
                os.writeBytes("exit\n")
                os.flush()
            }
            process.waitFor() == 0
        } catch (e: Exception) {
            false
        }
    }
}

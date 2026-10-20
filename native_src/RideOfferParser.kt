package com.tresletras.move

import android.graphics.Rect
import android.view.accessibility.AccessibilityNodeInfo
import java.text.Normalizer
import java.util.regex.Pattern

object RideOfferParser {

    private val DEFAULT_PRICE_PATTERN = Pattern.compile(
        "(?:\\+|R\\$|BRL|\\$)?\\s*([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2}))",
        Pattern.CASE_INSENSITIVE
    )

    private val KM_PATTERN = Pattern.compile(
        "([0-9]+(?:[.,][0-9]+)?)\\s*km",
        Pattern.CASE_INSENSITIVE
    )

    data class ParsedScreen(
        val prices: List<Double>,
        val distances: List<Double>,
        val acceptNodes: List<AccessibilityNodeInfo>,
        val allTexts: List<String>
    )

    /**
     * Varre a árvore de nós buscando preços, distâncias e o botão de aceite por texto OU por ViewId técnico
     */
    fun parseTree(
        root: AccessibilityNodeInfo?,
        keywords: List<String>,
        customViewId: String = "",
        customPriceRegex: String = ""
    ): ParsedScreen {
        val prices = mutableListOf<Double>()
        val distances = mutableListOf<Double>()
        val acceptNodes = mutableListOf<AccessibilityNodeInfo>()
        val allTexts = mutableListOf<String>()

        if (root == null) {
            return ParsedScreen(prices, distances, acceptNodes, allTexts)
        }

        // 1. Se foi especificado um ID técnico de visualização (ex: "com.uber:id/btn_accept" ou "btn_accept")
        if (customViewId.isNotBlank()) {
            val nodesById = root.findAccessibilityNodeInfosByViewId(customViewId)
            if (!nodesById.isNullOrEmpty()) {
                acceptNodes.addAll(nodesById)
            }
        }

        // 2. Compila regex personalizado se informado
        val pricePattern = if (customPriceRegex.isNotBlank()) {
            try { Pattern.compile(customPriceRegex, Pattern.CASE_INSENSITIVE) } catch (e: Exception) { DEFAULT_PRICE_PATTERN }
        } else {
            DEFAULT_PRICE_PATTERN
        }

        traverse(root, keywords, pricePattern, prices, distances, acceptNodes, allTexts)
        return ParsedScreen(prices, distances, acceptNodes, allTexts)
    }

    private fun traverse(
        node: AccessibilityNodeInfo,
        keywords: List<String>,
        pricePattern: Pattern,
        prices: MutableList<Double>,
        distances: MutableList<Double>,
        acceptNodes: MutableList<AccessibilityNodeInfo>,
        allTexts: MutableList<String>
    ) {
        val rawText = node.text?.toString() ?: node.contentDescription?.toString()
        if (!rawText.isNullOrBlank()) {
            val text = rawText.trim()
            allTexts.add(text)
            extractPrice(text, pricePattern)?.let { prices.add(it) }
            extractKm(text)?.let { distances.add(it) }

            // Se ainda não encontrou o botão pelo viewId, procura por palavras-chave
            if (acceptNodes.isEmpty() && isAcceptButton(node, text, keywords)) {
                acceptNodes.add(node)
            }
        }

        for (i in 0 until node.childCount) {
            val child = node.getChild(i) ?: continue
            traverse(child, keywords, pricePattern, prices, distances, acceptNodes, allTexts)
        }
    }

    private fun isAcceptButton(
        node: AccessibilityNodeInfo,
        text: String,
        keywords: List<String>
    ): Boolean {
        val normalized = removeAccents(text.lowercase())

        val matchesKeyword = keywords.any { kw ->
            val normKw = removeAccents(kw.trim().lowercase())
            normKw.isNotEmpty() && normalized.contains(normKw)
        }

        if (!matchesKeyword) return false

        return node.isClickable || (node.parent?.isClickable == true) || (node.parent?.parent?.isClickable == true)
    }

    fun extractPrice(text: String, pattern: Pattern = DEFAULT_PRICE_PATTERN): Double? {
        val matcher = pattern.matcher(text)
        var highestPrice: Double? = null

        while (matcher.find()) {
            try {
                val rawMatch = matcher.group(1) ?: continue
                val normalized = rawMatch.replace(".", "").replace(",", ".")
                val parsed = normalized.toDoubleOrNull()
                if (parsed != null && parsed > 0.0) {
                    if (highestPrice == null || parsed > highestPrice) {
                        highestPrice = parsed
                    }
                }
            } catch (e: Exception) {}
        }
        return highestPrice
    }

    private fun extractKm(text: String): Double? {
        val matcher = KM_PATTERN.matcher(text)
        if (matcher.find()) {
            val raw = matcher.group(1) ?: return null
            val normalized = raw.replace(",", ".")
            return normalized.toDoubleOrNull()
        }
        return null
    }

    fun getNodeCenter(node: AccessibilityNodeInfo): Pair<Int, Int> {
        val rect = Rect()
        node.getBoundsInScreen(rect)
        return Pair(rect.centerX(), rect.centerY())
    }

    private fun removeAccents(str: String): String {
        val nfd = Normalizer.normalize(str, Normalizer.Form.NFD)
        return Pattern.compile("\\p{InCombiningDiacriticalMarks}+").matcher(nfd).replaceAll("")
    }
}

package com.qrb.share

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity

class ShareActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        handleShareIntent(intent)
        finish()
    }

    private fun handleShareIntent(intent: Intent?) {
        if (intent == null) return

        val action = intent.action
        val type = intent.type

        val baseUrl = getString(R.string.web_app_url)

        if (Intent.ACTION_SEND == action && type != null) {
            if ("text/plain" == type) {
                val sharedText = intent.getStringExtra(Intent.EXTRA_TEXT)
                if (!sharedText.isNull_or_empty()) {
                    val encodedText = Uri.encode(sharedText)
                    val targetUrl = "$baseUrl/?text=$encodedText"
                    
                    Toast.makeText(this, "Opening QRB Web App...", Toast.LENGTH_SHORT).show()
                    openBrowser(targetUrl)
                    return
                }
            } else {
                // File or image URI share
                val imageUri = intent.getParcelableExtra<Uri>(Intent.EXTRA_STREAM)
                if (imageUri != null) {
                    Toast.makeText(this, "Opening QRB for file transfer...", Toast.LENGTH_SHORT).show()
                    val targetUrl = "$baseUrl/?shared_file=1"
                    openBrowser(targetUrl)
                    return
                }
            }
        } else if (Intent.ACTION_SEND_MULTIPLE == action && type != null) {
            val imageUris = intent.getParcelableArrayListExtra<Uri>(Intent.EXTRA_STREAM)
            if (!imageUris.isNullOrEmpty()) {
                Toast.makeText(this, "Opening QRB for file transfer...", Toast.LENGTH_SHORT).show()
                val targetUrl = "$baseUrl/?shared_file=multiple"
                openBrowser(targetUrl)
                return
            }
        }

        // Default fallback redirect to web app homepage
        openBrowser(baseUrl)
    }

    private fun openBrowser(url: String) {
        val browserIntent = Intent(Intent.ACTION_VIEW, Uri.parse(url)).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        startActivity(browserIntent)
    }

    private fun String?.isNull_or_empty(): Boolean {
        return this == null || this.trim().isEmpty()
    }
}

package com.qrb.share

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Simple launcher UI
        val layout = android.widget.LinearLayout(this).apply {
            orientation = android.widget.LinearLayout.VERTICAL
            gravity = android.view.Gravity.CENTER
            setPadding(64, 64, 64, 64)
            setBackgroundColor(android.graphics.Color.parseColor("#0A0F1D"))
        }

        val titleText = TextView(this).apply {
            text = "📱 QRB (QR Bridge)"
            textSize = 24f
            setTextColor(android.graphics.Color.WHITE)
            setTypeface(null, android.graphics.Typeface.BOLD)
            gravity = android.view.Gravity.CENTER
        }

        val descText = TextView(this).apply {
            text = "QRB is installed as a Share Target!\n\nTo use QRB, select any text or file in any Android app and tap 'Share via QRB'."
            textSize = 14f
            setTextColor(android.graphics.Color.parseColor("#94A3B8"))
            gravity = android.view.Gravity.CENTER
            setPadding(0, 32, 0, 48)
        }

        val openWebBtn = Button(this).apply {
            text = "Open QRB Web Scanner"
            setBackgroundColor(android.graphics.Color.parseColor("#0D9488"))
            setTextColor(android.graphics.Color.WHITE)
            setOnClickListener {
                val intent = Intent(Intent.ACTION_VIEW, Uri.parse(getString(R.string.web_app_url)))
                startActivity(intent)
            }
        }

        layout.addView(titleText)
        layout.addView(descText)
        layout.addView(openWebBtn)

        setContentView(layout)
    }
}

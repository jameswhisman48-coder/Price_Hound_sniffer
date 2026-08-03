package com.pricehound.app;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {
  @Override public void onCreate(Bundle state) { super.onCreate(state); WebView w = new WebView(this); w.setWebViewClient(new WebViewClient()); WebSettings s = w.getSettings(); s.setJavaScriptEnabled(true); s.setDomStorageEnabled(true); s.setAllowFileAccess(false); w.loadUrl("https://409c3b75777e2a034c608e75c5233042.ctonew.app/"); setContentView(w); }
}

import React, { useEffect, useRef } from 'react';

function TradingViewWidget({ symbol = "BTCUSDT" }) {
  const container = useRef();

  useEffect(() => {
    // Önceki widget'ı temizle
    if (container.current.hasChildNodes()) {
      container.current.innerHTML = '';
    }

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = () => {
      if (typeof window.TradingView !== 'undefined') {
        new window.TradingView.widget({
          autosize: true,
          symbol: `BINANCE:${symbol}`,
          interval: "D",
          timezone: "Europe/Istanbul",
          theme: "dark",
          style: "1",
          locale: "tr",
          toolbar_bg: "#f1f3f6",
          enable_publishing: false,
          allow_symbol_change: true,
          container_id: "tradingview_9900c",
          hide_side_toolbar: false,
          studies: [
            "MASimple@tv-basicstudies",
            "RSI@tv-basicstudies",
            "MACD@tv-basicstudies",
            "BB@tv-basicstudies"
          ],
          disabled_features: [
            "use_localstorage_for_settings",
            "widget_logo",
            "timeframes_toolbar",
            "volume_force_overlay",
            "create_volume_indicator_by_default"
          ],
          enabled_features: [
            "hide_left_toolbar_by_default",
            "move_logo_to_main_pane",
            "same_data_requery",
            "side_toolbar_in_fullscreen_mode"
          ],
          overrides: {
            "mainSeriesProperties.candleStyle.upColor": "#26a69a",
            "mainSeriesProperties.candleStyle.downColor": "#ef5350",
            "mainSeriesProperties.candleStyle.wickUpColor": "#26a69a",
            "mainSeriesProperties.candleStyle.wickDownColor": "#ef5350"
          },
          loading_screen: { backgroundColor: "#131722" },
          custom_css_url: "./tradingview-custom.css",
          save_image: false,
          hide_volume: true,
          no_referral_id: true,
          popup_width: "1000",
          popup_height: "650",
          hide_floating_toolbar: false,
          withdateranges: true,
          allow_symbol_select: true,
          show_popup_button: true,
          enable_hiding_top_toolbar: true,
          hideideas: true,
          studies_overrides: {},
        });
      }
    };
    container.current.appendChild(script);

    return () => {
      if (container.current) {
        container.current.innerHTML = '';
      }
    };
  }, [symbol]);

  return (
    <div className="tradingview-widget-container" ref={container}>
      <div id="tradingview_9900c" style={{ height: "100%", width: "100%" }} />
    </div>
  );
}

export default TradingViewWidget;
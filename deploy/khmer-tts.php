<?php
/**
 * khmer-tts.php — 高棉语（柬埔寨语）转账播报 TTS 接口
 * 引擎：Google Translate TTS（与 gTTS 同款）
 *
 * 请求：POST JSON
 *   { "template": "ជូនដំណឹង ****", "amount": "12.5", "currency": "USD" }
 *   template 中用 **** 占位金额位置
 * 规则：
 *   - KHR 瑞尔：整数转高棉语读法
 *   - USD 美金：整数 + 小数 0.1~0.9 读为 XXសេន（分），结尾追加 ដុល្លា
 *   - 不读“点”（ចំណុច）
 * 返回：audio/mpeg (MP3)
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

// 高棉语数字词库
$KHMER_WORDS = [
    0  => "សូន្យ",
    1  => "មួយ",
    2  => "ពីរ",
    3  => "បី",
    4  => "បួន",
    5  => "ប្រាំ",
    6  => "ប្រាំមួយ",
    7  => "ប្រាំពីរ",
    8  => "ប្រាំបី",
    9  => "ប្រាំបួន",
    10 => "ដប់",
    100 => "រយ",
    1000 => "ពាន់",
    10000 => "ម៉ឺន",
    100000 => "សែន",
    1000000 => "លាន",
];

/**
 * 整数转高棉语朗读文字（递归处理，大额安全）
 */
function intToKhmerWords($num) {
    global $KHMER_WORDS;
    $num = (int)$num;
    if ($num === 0) return $KHMER_WORDS[0];

    $units = [
        [1000000, $KHMER_WORDS[1000000]],
        [100000,  $KHMER_WORDS[100000]],
        [10000,   $KHMER_WORDS[10000]],
        [1000,    $KHMER_WORDS[1000]],
        [100,     $KHMER_WORDS[100]],
    ];

    $parts = [];
    foreach ($units as $u) {
        list($base, $word) = $u;
        if ($num >= $base) {
            $q = intdiv($num, $base);
            $parts[] = intToKhmerWords($q) . " " . $word;
            $num = $num % $base;
        }
    }

    if ($num >= 10) {
        if ($num === 10) {
            $parts[] = $KHMER_WORDS[10];
        } else {
            $parts[] = $KHMER_WORDS[intdiv($num, 10)] . " " . $KHMER_WORDS[10];
        }
        $num = $num % 10;
    }
    if ($num > 0) {
        $parts[] = $KHMER_WORDS[$num];
    }
    return implode(" ", $parts);
}

/**
 * 调用 Google TTS，返回 MP3 二进制
 */
function googleTTS($text, $lang = 'km') {
    // 文本过长时按空格分段（每段 <= 180 字符），再拼接
    $chunks = [];
    if (mb_strlen($text, 'UTF-8') <= 180) {
        $chunks[] = $text;
    } else {
        $words = explode(' ', $text);
        $cur = '';
        foreach ($words as $w) {
            if (mb_strlen($cur . ' ' . $w, 'UTF-8') > 180) {
                $chunks[] = trim($cur);
                $cur = $w;
            } else {
                $cur = trim($cur . ' ' . $w);
            }
        }
        if (trim($cur) !== '') $chunks[] = trim($cur);
    }

    $mp3 = '';
    foreach ($chunks as $chunk) {
        $url = 'https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl='
             . $lang . '&q=' . rawurlencode($chunk);
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_TIMEOUT => 20,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_SSL_VERIFYHOST => false,
            CURLOPT_ENCODING => '',
            CURLOPT_HTTPHEADER => [
                'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
                'Referer: https://translate.google.com/',
                'Accept-Language: km-KH,km;q=0.9,en;q=0.8',
            ],
        ]);
        $data = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $err = curl_error($ch);
        curl_close($ch);
        if ($data === false || $code !== 200 || strlen($data) < 100) {
            throw new Exception("Google TTS 请求失败 HTTP=$code ERR=$err");
        }
        $mp3 .= $data;
    }
    return $mp3;
}

// ---------- 主流程 ----------
try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        echo json_encode(["service" => "khmer-tts", "usage" => "POST JSON {template, amount, currency} 或 {text}"]);
        exit;
    }

    $raw = file_get_contents('php://input');
    $req = json_decode($raw, true);
    if (!is_array($req)) {
        // 兼容表单提交
        $req = $_POST;
    }

    // 纯文本模式：直接传 text 合成（用于拦截浏览器 speechSynthesis 的高棉语播报）
    if (isset($req['text']) && trim((string)$req['text']) !== '') {
        $speakText = (string)$req['text'];
        $mp3 = googleTTS($speakText, 'km');
        header('Content-Type: audio/mpeg');
        header('Content-Length: ' . strlen($mp3));
        header('Cache-Control: no-cache, no-store, must-revalidate');
        header('X-TTS-Text: ' . rawurlencode($speakText));
        echo $mp3;
        exit;
    }

    $template = isset($req['template']) ? (string)$req['template'] : "ជូនដំណឹង ****";
    $amount   = isset($req['amount']) ? $req['amount'] : "0";
    $currency = isset($req['currency']) ? strtoupper((string)$req['currency']) : "KHR";

    if (!is_numeric($amount)) {
        http_response_code(400);
        echo json_encode(["error" => "amount 必须是数字"]);
        exit;
    }

    $rawf = (float)$amount;
    $intPart = (int)floor($rawf);
    // 第一位小数（0~9），银行小额 0.1 / 0.5 起
    $dec1 = (int)round(($rawf - $intPart) * 10);

    // 整数部分为 0 时不读“零”（小额 0.5 USD 直接读 ប្រាំសេន）
    $khmerText = $intPart > 0 ? intToKhmerWords($intPart) : "";

    if ($currency === 'USD') {
        // 0.1~0.9 读为 XXសេន（分），不读“点”
        if ($dec1 >= 1 && $dec1 <= 9) {
            $khmerText = trim($khmerText . " " . $KHMER_WORDS[$dec1] . "សេន");
        }
        $khmerText .= " ដុល្លា";
    }

    // 模板占位符替换
    $speakText = str_replace('****', $khmerText, $template);

    // 合成
    $mp3 = googleTTS($speakText, 'km');

    // 返回 MP3
    header('Content-Type: audio/mpeg');
    header('Content-Length: ' . strlen($mp3));
    header('Cache-Control: no-cache, no-store, must-revalidate');
    header('X-TTS-Text: ' . rawurlencode($speakText)); // 便于调试查看实际朗读文本
    echo $mp3;
} catch (Exception $e) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(["error" => $e->getMessage()]);
}

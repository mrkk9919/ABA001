<?php
/**
 * aba-proxy.php — 反向代理到本地 Node ABA 应用 (127.0.0.1:5200)
 * 由 .htaccess 将 /app/app_17epebn0nyt* 和 /api/*（除 khmer-tts 外）转发到此。
 */
$UPSTREAM = 'http://127.0.0.1:5200';

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$query = parse_url($_SERVER['REQUEST_URI'], PHP_URL_QUERY);
$targetUrl = $UPSTREAM . $path . ($query ? '?' . $query : '');

$headers = [];
foreach (getallheaders() as $name => $value) {
    if (strtolower($name) === 'host') continue;
    if (strtolower($name) === 'accept-encoding') continue;
    $headers[] = "$name: $value";
}

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => $targetUrl,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HEADER => true,
    CURLOPT_FOLLOWLOCATION => false,
    CURLOPT_HTTPHEADER => $headers,
    CURLOPT_TIMEOUT => 30,
    CURLOPT_ENCODING => '',
]);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, file_get_contents('php://input'));
} elseif ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $_SERVER['REQUEST_METHOD']);
}

$response = curl_exec($ch);
$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
$error = curl_error($ch);
curl_close($ch);

if ($error) {
    http_response_code(502);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(["error" => "aba upstream: $error"]);
    exit;
}

$responseHeaders = substr($response, 0, $headerSize);
$body = substr($response, $headerSize);

http_response_code($statusCode);
if ($contentType) header("Content-Type: $contentType");
header('Cache-Control: no-cache, no-store, must-revalidate');

// 处理上游 redirect
foreach (explode("\r\n", $responseHeaders) as $header) {
    if (stripos($header, 'Location:') === 0) {
        $loc = trim(substr($header, 9));
        // 上游 302 到 /app/app_17epebn0nyt/ 时直接透传
        header("Location: $loc");
        exit;
    }
}
echo $body;

import http.server
import socketserver
import argparse


def run_simple_http_server(folder, host, port):
    """
    运行一个简单的HTTP服务器。

    Args:
        folder (str): 要共享的文件夹路径。
        host (str): 主机地址。
        port (int): 端口号。
    """

    class Handler(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=folder, **kwargs)

        # 重写 extensions_map 以确保 JavaScript 文件有正确的 MIME 类型
        extensions_map = {
            **http.server.SimpleHTTPRequestHandler.extensions_map,
            ".js": "application/javascript",
            ".mjs": "application/javascript",
            ".json": "application/json",
            ".css": "text/css",
        }

    with socketserver.TCPServer((host, port), Handler) as httpd:
        print(f"Serving HTTP on {host} port {port} (http://{host}:{port}/)")
        print(
            f"JavaScript files will be served with correct MIME type: application/javascript"
        )
        httpd.serve_forever()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Simple HTTP Server")
    parser.add_argument("--folder", default=".", help="Folder to share")
    parser.add_argument("--host", default="0.0.0.0", help="Host address")
    parser.add_argument("--port", type=int, default=8080, help="Port number")

    args = parser.parse_args()

    run_simple_http_server(args.folder, args.host, args.port)

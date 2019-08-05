from amo_storage import create_app
from argparse import ArgumentParser

if __name__ == '__main__':

    parser = ArgumentParser()
    parser.add_argument('--config_path', help="path to config ini file", default="config.ini")
    parser.add_argument('--key_path', help="path to ceph key file", default="key.json")
    parser.add_argument('--host', default="127.0.0.1", help="host to run")
    parser.add_argument('--port', default=5000, help="running port")

    args = parser.parse_args()
    cfg_path = args.config_path
    key_path = args.key_path

    host = args.host
    port = args.port

    app = create_app(CONFIG_PATH=cfg_path, KEY_PATH=key_path)

    app.run(host, port)

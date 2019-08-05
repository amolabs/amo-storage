from amo_storage import create_app
from argparse import ArgumentParser

if __name__ == '__main__':

    parser = ArgumentParser()
    parser.add_argument('--config_dir', help="path to config directory", default="configurations")
    parser.add_argument('--host', default="127.0.0.1", help="host to run")
    parser.add_argument('--port', default=5000, help="running port")

    args = parser.parse_args()
    cfg_path = args.config_dir

    host = args.host
    port = args.port

    app = create_app(CONFIG_DIR=args.config_dir)

    app.run(host, port)

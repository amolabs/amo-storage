#!/bin/bash

# amocli (binary) should be installed already at $GOBIN

AMOCLI=amocli
RPC="--rpc amo-tokyo2:26657"
STO="--sto amo-sto:5000"
OPT="$RPC $STO"
SLEEP=0.5
testfile=test_script/testfile

eval $(amocli key list | awk '{ if ($2 != "t0") printf "%s=%s\n",$2,$4 }')
faucet=BEFF22606A9FB730455736E7B33C846171F2865C

#!/bin/bash

. $(dirname $0)/env.sh

enckey="11ffeeff"

# u2 try downloading non-existent parcel p1 (ERROR)
# faucet transfer 1 AMO to u2
# u1 upload encrypted file f1 to storage, obtain parcel id p1
# u1 register p1
# u1 discard p1
# u1 register p1
# u2 try downloading ungranted parcel p1 (ERROR)
# u2 request p1 with 1 AMO
# u2 cancel request for p1
# u2 request p1 with 1 AMO
# u2 try downloading ungranted parcel p1 (ERROR)
# u1 grant u2 on p1, collect 1 AMO
# u2 download encrypted file f1 associated with parcel id p1
# u2 decrypt f1 with key custody granted by u1
# u1 revoke grant given to u2 on p1
# u2 try downloading revoked parcel p1 (ERROR)
# u1 remove p1 from storage
# u1 transfer 1 AMO to faucet

fail() {
	echo "test failed"
	echo $1
	exit -1
}

base64 -b64 /dev/urandom | head -10 > $testfile

echo "u2 try downloading non-existent parcel p1 (ERROR)"
out=$($AMOCLI $OPT --json --user u2 parcel download 1f1f1f1f --file downloaded)
s=$(echo $out | python -c "import sys, json; print json.load(sys.stdin)['status']")
if [ "$s" != "403" ]; then fail "$out"; fi
sleep $SLEEP

echo "purse transfer 1 AMO to u2"
out=$($AMOCLI $OPT --json --user purse tx transfer $u2 1000000000000000000)
h=$(echo $out | python -c "import sys, json; print json.load(sys.stdin)['height']")
if [ -z "$h" -o "$h" == "0" ]; then fail $out; fi
sleep $SLEEP

echo "u1 upload encrypted file f1 to storage, obtain parcel id p1"
#out=$($AMOCLI $OPT --json --user u1 parcel upload --file $testfile --enckey $enckey)
out=$($AMOCLI $OPT --json --user u1 parcel upload --file $testfile)
s=$(echo $out | python -c "import sys, json; print json.load(sys.stdin)['status']")
if [ ! -z $s ]; then fail "$out"; fi
parcid=$(echo $out | python -c "import sys, json; print json.load(sys.stdin)['id']")
echo parcel id = $parcid
sleep $SLEEP

echo "u1 register p1"
#out=$($AMOCLI $OPT --json --user u1 tx register $parcid $enckey)
out=$($AMOCLI $OPT --json --user u1 tx register $parcid $enckey)
h=$(echo $out | python -c "import sys, json; print json.load(sys.stdin)['height']")
if [ -z "$h" -o "$h" == "0" ]; then fail $out; fi
sleep $SLEEP

echo "u1 discard p1"
out=$($AMOCLI $OPT --json --user u1 tx discard $parcid)
h=$(echo $out | python -c "import sys, json; print json.load(sys.stdin)['height']")
if [ -z "$h" -o "$h" == "0" ]; then fail $out; fi
sleep $SLEEP

echo "u1 register p1 again"
out=$($AMOCLI $OPT --json --user u1 tx register $parcid $enckey)
h=$(echo $out | python -c "import sys, json; print json.load(sys.stdin)['height']")
if [ -z "$h" -o "$h" == "0" ]; then fail $out; fi
sleep $SLEEP

echo "u2 try downloading ungranted parcel p1 (ERROR)"
out=$($AMOCLI $OPT --json --user u2 parcel download $parcid --file downloaded)
s=$(echo $out | python -c "import sys, json; print json.load(sys.stdin)['status']")
if [ "$s" != "403" ]; then fail "$out"; fi
sleep $SLEEP

echo "u2 request p1 with 1 AMO"
out=$($AMOCLI $OPT --json --user u2 tx request $parcid 1000000000000000000)
# check balance of u2
h=$(echo $out | python -c "import sys, json; print json.load(sys.stdin)['height']")
if [ -z "$h" -o "$h" == "0" ]; then fail $out; fi
sleep $SLEEP

echo "u2 cancel request for p1"
out=$($AMOCLI $OPT --json --user u2 tx cancel $parcid)
# check balance of u2
h=$(echo $out | python -c "import sys, json; print json.load(sys.stdin)['height']")
if [ -z "$h" -o "$h" == "0" ]; then fail $out; fi
sleep $SLEEP

echo "u2 request p1 with 1 AMO again"
out=$($AMOCLI $OPT --json --user u2 tx request $parcid 1000000000000000000)
h=$(echo $out | python -c "import sys, json; print json.load(sys.stdin)['height']")
if [ -z "$h" -o "$h" == "0" ]; then fail $out; fi
sleep $SLEEP

echo "u2 try downloading ungranted parcel p1 (ERROR)"
out=$($AMOCLI $OPT --json --user u2 parcel download $parcid --file downloaded)
s=$(echo $out | python -c "import sys, json; print json.load(sys.stdin)['status']")
if [ "$s" != "403" -a "$s" != "404" ]; then fail "$out"; fi
sleep $SLEEP

echo "u1 grant u2 on p1, collect 1 AMO"
out=$($AMOCLI $OPT --json --user u1 tx grant $parcid $u2 $enckey)
# check balance
h=$(echo $out | python -c "import sys, json; print json.load(sys.stdin)['height']")
if [ -z "$h" -o "$h" == "0" ]; then fail $out; fi
sleep $SLEEP

echo "u2 download encrypted file f1 associated with parcel id p1"
out=$($AMOCLI $OPT --json --user u2 parcel download $parcid --file downloaded)
f=$(echo $out | python -c "import sys, json; print json.load(sys.stdin)['filename']")
if [ -z "$f" ]; then fail "$out"; fi
sleep $SLEEP

echo "u2 decrypt f1 with key custody granted by u1"
echo "diff start"
diff $testfile downloaded || echo file does not match
echo "diff end"
# hmm
sleep $SLEEP

echo "u1 revoke grant given to u2 on p1"
out=$($AMOCLI $OPT --json --user u1 tx revoke $parcid $u2)
h=$(echo $out | python -c "import sys, json; print json.load(sys.stdin)['height']")
if [ -z "$h" -o "$h" == "0" ]; then fail $out; fi
sleep $SLEEP

echo "u2 try downloading revoked parcel p1 (ERROR)"
out=$($AMOCLI $OPT --json --user u2 parcel download $parcid --file downloaded)
s=$(echo $out | python -c "import sys, json; print json.load(sys.stdin)['status']")
if [ "$s" != "403" -a "$s" != "404" ]; then fail "$out"; fi
sleep $SLEEP

echo "u1 remove p1 from storage"
out=$($AMOCLI $OPT --json --user u1 parcel remove $parcid)
echo $out
sleep $SLEEP

echo "u2 try downloading removed parcel p1 (ERROR)"
out=$($AMOCLI $OPT --json --user u2 parcel download $parcid --file downloaded)
s=$(echo $out | python -c "import sys, json; print json.load(sys.stdin)['status']")
if [ "$s" != "403" -a "$s" != "404" ]; then fail "$out"; fi
sleep $SLEEP

echo "u1 transfer 1 AMO to purse"
out=$($AMOCLI $OPT --json --user u1 tx transfer $purse 1000000000000000000)
# check balance
h=$(echo $out | python -c "import sys, json; print json.load(sys.stdin)['height']")
if [ -z "$h" -o "$h" == "0" ]; then fail $out; fi

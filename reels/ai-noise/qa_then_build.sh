#!/usr/bin/env bash
cd "$(dirname "$0")"
node render.mjs qa 30 > out/qa.log 2>&1
if grep -q "TEXT QA PASS" out/qa.log; then ./finalize.sh > out/finalize.log 2>&1; echo BUILT; else echo QA_FAILED; fi

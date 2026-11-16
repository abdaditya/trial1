#!/bin/bash
# One-time: connect Instagram. You only COPY in the browser and press Enter here; nothing is pasted.
cd "$(dirname "$0")" || exit 1
touch .env && chmod 600 .env
if ! grep -Eq '^FB_APP_SECRET=[0-9a-f]{32}$' .env; then
  while true; do
    echo
    echo "STEP 1 of 2: In the 'Creator Radar | Meta' tab, select the App secret and copy it (Cmd+C)."
    printf "Then click here and press Enter (do not paste)... "
    read -r _
    SECRET="$(pbpaste | tr -d '[:space:]')"
    if printf '%s' "$SECRET" | grep -Eq '^[0-9a-f]{32}$'; then break; fi
    echo "The clipboard does not hold an app secret yet (32 letters and numbers). Copy it and try again."
  done
  grep -v '^FB_APP_SECRET=' .env > .env.tmp; echo "FB_APP_SECRET=$SECRET" >> .env.tmp; mv .env.tmp .env; chmod 600 .env
  echo "App secret saved."
fi
while true; do
  echo
  echo "STEP 2 of 2: In the 'Graph API Explorer' tab, click Generate Access Token and approve,"
  echo "then click the copy icon next to the Access Token box."
  printf "Then click here and press Enter (do not paste)... "
  read -r _
  TOKEN="$(pbpaste | tr -d '[:space:]')"
  case "$TOKEN" in EAA*) break ;; esac
  echo "The clipboard does not hold an access token yet (very long, starts with EAA). Copy it and try again."
done
.venv/bin/python -m app.collect_instagram setup "$TOKEN" && .venv/bin/python -m app.refresh

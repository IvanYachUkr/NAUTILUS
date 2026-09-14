import asyncio
import json
import urllib.request
import websockets
import base64

async def get_page_ws():
    targets = json.loads(urllib.request.urlopen('http://localhost:9222/json').read())
    page = [t for t in targets if t.get('type') == 'page' and 'openguessr' in t.get('url', '')][0]
    return page['webSocketDebuggerUrl']

async def ensure_map(ws):
    # Check if getMap returns an object
    check_msg = {'id': 1001, 'method': 'Runtime.evaluate', 'params': {'expression': '!!window.NautilusPinHelper && !!window.NautilusPinHelper.getMap()', 'returnByValue': True}}
    await ws.send(json.dumps(check_msg))
    res = json.loads(await ws.recv())
    if res.get('result', {}).get('result', {}).get('value'):
        return True

    # If not attached, extract from _leaflet_events
    extract_js = '''(() => {
        const el = document.getElementById('map');
        if (!el || !el._leaflet_events) return null;
        for (const k of Object.keys(el._leaflet_events)) {
            if (typeof el._leaflet_events[k] === 'function') return k;
        }
        return null;
    })()'''
    await ws.send(json.dumps({'id': 1002, 'method': 'Runtime.evaluate', 'params': {'expression': extract_js, 'returnByValue': True}}))
    res2 = json.loads(await ws.recv())
    event_key = res2.get('result', {}).get('result', {}).get('value')
    if not event_key:
        return False

    # Get function object
    await ws.send(json.dumps({'id': 1003, 'method': 'Runtime.evaluate', 'params': {'expression': f'document.getElementById("map")._leaflet_events["{event_key}"]'}}))
    res3 = json.loads(await ws.recv())
    fn_id = res3['result']['result']['objectId']

    await ws.send(json.dumps({'id': 1004, 'method': 'Runtime.getProperties', 'params': {'objectId': fn_id}}))
    res4 = json.loads(await ws.recv())
    scope_id = [p['value']['objectId'] for p in res4['result'].get('internalProperties', []) if p.get('name') == '[[Scopes]]'][0]

    await ws.send(json.dumps({'id': 1005, 'method': 'Runtime.getProperties', 'params': {'objectId': scope_id}}))
    res5 = json.loads(await ws.recv())
    val_id = res5['result']['result'][0]['value']['objectId']

    await ws.send(json.dumps({'id': 1006, 'method': 'Runtime.getProperties', 'params': {'objectId': val_id}}))
    res6 = json.loads(await ws.recv())
    n_id = [v['value']['objectId'] for v in res6['result']['result'] if v.get('name') == 'n'][0]

    # Attach to window
    attach_fn = '''function() {
        window._leaflet_active_map = this;
        window.L = window.L || {};
        window.L._maps = window.L._maps || {};
        window.L._maps[this._leaflet_id || "main"] = this;
        return true;
    }'''
    await ws.send(json.dumps({'id': 1007, 'method': 'Runtime.callFunctionOn', 'params': {'objectId': n_id, 'functionDeclaration': attach_fn, 'returnByValue': True}}))
    res7 = json.loads(await ws.recv())
    return res7.get('result', {}).get('result', {}).get('value', False)

async def capture_screen(ws, filepath):
    msg = {'id': 2001, 'method': 'Page.captureScreenshot', 'params': {'format': 'png'}}
    await ws.send(json.dumps(msg))
    res = json.loads(await ws.recv())
    img_data = base64.b64decode(res['result']['data'])
    with open(filepath, 'wb') as f:
        f.write(img_data)
    return filepath

async def place_pin(lat, lng, zoom=15):
    ws_url = await get_page_ws()
    async with websockets.connect(ws_url, max_size=20*1024*1024) as ws:
        await ensure_map(ws)
        expr = f'window.NautilusPinHelper.go({lat}, {lng}, {zoom})'
        await ws.send(json.dumps({'id': 3001, 'method': 'Runtime.evaluate', 'params': {'expression': expr, 'awaitPromise': True}}))
        await ws.recv()
        await asyncio.sleep(0.6)
        # Check log
        log_expr = 'document.querySelector("#nautilus-pin-helper-log").children[0]?.innerText'
        await ws.send(json.dumps({'id': 3002, 'method': 'Runtime.evaluate', 'params': {'expression': log_expr, 'returnByValue': True}}))
        res = json.loads(await ws.recv())
        return res.get('result', {}).get('result', {}).get('value')

async def submit_guess():
    ws_url = await get_page_ws()
    async with websockets.connect(ws_url, max_size=20*1024*1024) as ws:
        expr = '''(() => {
            const btn = document.querySelector('button.confirm-button') || Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim().toLowerCase() === 'guess');
            if (btn) {
                btn.click();
                return 'clicked';
            }
            return 'not found';
        })()'''
        await ws.send(json.dumps({'id': 4001, 'method': 'Runtime.evaluate', 'params': {'expression': expr, 'returnByValue': True}}))
        res = json.loads(await ws.recv())
        return res.get('result', {}).get('result', {}).get('value')

async def click_button_by_text(text):
    ws_url = await get_page_ws()
    async with websockets.connect(ws_url, max_size=20*1024*1024) as ws:
        expr = f'''(() => {{
            const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.toLowerCase().includes('{text.lower()}'));
            if (btn) {{
                btn.click();
                return 'clicked ' + btn.textContent.trim();
            }}
            return 'not found';
        }})()'''
        await ws.send(json.dumps({'id': 5001, 'method': 'Runtime.evaluate', 'params': {'expression': expr, 'returnByValue': True}}))
        res = json.loads(await ws.recv())
        return res.get('result', {}).get('result', {}).get('value')

async def capture_snap(filepath):
    ws_url = await get_page_ws()
    async with websockets.connect(ws_url, max_size=20*1024*1024) as ws:
        await ws.send(json.dumps({'id': 5002, 'method': 'Page.captureScreenshot'}))
        res = json.loads(await ws.recv())
        data = res['result']['data']
        with open(filepath, 'wb') as f:
            f.write(base64.b64decode(data))
        return f"Saved {filepath}"

async def rotate_view(deg):
    ws_url = await get_page_ws()
    async with websockets.connect(ws_url, max_size=20*1024*1024) as ws:
        # 100px drag ~= 30 degrees horizontal rotation
        pixels = int(deg * 3.33)
        start_x = 700 if pixels > 0 else 300
        end_x = start_x - pixels
        await ws.send(json.dumps({'id': 1, 'method': 'Input.dispatchMouseEvent', 'params': {'type': 'mousePressed', 'x': start_x, 'y': 400, 'button': 'left', 'clickCount': 1}}))
        await ws.recv()
        steps = 15
        for i in range(1, steps + 1):
            cur_x = int(start_x + (end_x - start_x) * (i / steps))
            await ws.send(json.dumps({'id': 2, 'method': 'Input.dispatchMouseEvent', 'params': {'type': 'mouseMoved', 'x': cur_x, 'y': 400, 'button': 'left'}}))
            await ws.recv()
            await asyncio.sleep(0.01)
        await ws.send(json.dumps({'id': 3, 'method': 'Input.dispatchMouseEvent', 'params': {'type': 'mouseReleased', 'x': end_x, 'y': 400, 'button': 'left'}}))
        await ws.recv()
        return f"Rotated ~{deg} deg"

async def step_view():
    ws_url = await get_page_ws()
    async with websockets.connect(ws_url, max_size=20*1024*1024) as ws:
        # Click on forward road chevron at center bottom
        await ws.send(json.dumps({'id': 1, 'method': 'Input.dispatchMouseEvent', 'params': {'type': 'mousePressed', 'x': 980, 'y': 770, 'button': 'left', 'clickCount': 1}}))
        await ws.recv()
        await ws.send(json.dumps({'id': 2, 'method': 'Input.dispatchMouseEvent', 'params': {'type': 'mouseReleased', 'x': 980, 'y': 770, 'button': 'left'}}))
        await ws.recv()
        return "Stepped forward"

if __name__ == '__main__':
    import sys
    if len(sys.argv) < 2:
        print("Usage: python3 nautilus_player.py [pin <lat> <lng> [zoom] | guess | continue | confirm | snap <file> | look <deg> | step | reset_view | ensure]")
        sys.exit(1)
    cmd = sys.argv[1]
    if cmd == 'pin':
        lat = float(sys.argv[2])
        lng = float(sys.argv[3])
        zoom = int(sys.argv[4]) if len(sys.argv) > 4 else 15
        out = asyncio.run(place_pin(lat, lng, zoom))
        print(f"PIN RESULT: {out}")
    elif cmd == 'guess':
        out = asyncio.run(submit_guess())
        print(f"GUESS RESULT: {out}")
    elif cmd == 'continue':
        out = asyncio.run(click_button_by_text('Continue'))
        print(f"CONTINUE RESULT: {out}")
    elif cmd == 'confirm':
        out = asyncio.run(click_button_by_text('Confirm'))
        print(f"CONFIRM RESULT: {out}")
    elif cmd == 'snap':
        path = sys.argv[2] if len(sys.argv) > 2 else 'screenshot.png'
        out = asyncio.run(capture_snap(path))
        print(f"SNAP RESULT: {out}")
    elif cmd == 'look':
        deg = float(sys.argv[2]) if len(sys.argv) > 2 else 90.0
        out = asyncio.run(rotate_view(deg))
        print(f"LOOK RESULT: {out}")
    elif cmd == 'step':
        out = asyncio.run(step_view())
        print(f"STEP RESULT: {out}")
    elif cmd == 'reset_view':
        out = asyncio.run(click_button_by_text('Return'))
        print(f"RESET RESULT: {out}")
    elif cmd == 'ensure':
        async def do_ensure():
            ws_url = await get_page_ws()
            async with websockets.connect(ws_url, max_size=20*1024*1024) as ws:
                ok = await ensure_map(ws)
                print(f"ENSURE RESULT: {ok}")
        asyncio.run(do_ensure())
    elif cmd == 'eval':
        js_code = sys.argv[2]
        async def do_eval():
            ws_url = await get_page_ws()
            async with websockets.connect(ws_url, max_size=20*1024*1024) as ws:
                await ws.send(json.dumps({'id': 1, 'method': 'Runtime.evaluate', 'params': {'expression': js_code, 'returnByValue': True}}))
                res = json.loads(await ws.recv())
                print(res.get('result', {}).get('result', {}).get('value'))
        asyncio.run(do_eval())
    else:
        print(f"Unknown command: {cmd}")


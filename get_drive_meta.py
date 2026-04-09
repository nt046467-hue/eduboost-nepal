import urllib.request

url = 'https://drive.google.com/uc?export=download&id=1eeH-2sbUgOsryC_GpzXenCEJJltI8fpJ'
req = urllib.request.Request(url, method='HEAD')
try:
    with urllib.request.urlopen(req, timeout=20) as r:
        print('status', r.status)
        for k, v in r.getheaders():
            if k.lower() in ('content-length', 'content-type', 'location', 'content-disposition'):
                print(f'{k}: {v}')
except Exception as e:
    print('error', e)

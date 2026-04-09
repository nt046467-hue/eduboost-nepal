import urllib.request

urls = [
    'https://drive.google.com/uc?export=download&id=1eeH-2sbUgOsryC_GpzXenCEJJltI8fpJ',
    'https://drive.google.com/uc?export=download&id=1ihIKzY2VKbiUQEFHhkHZwEK8oa_hSF9O',
    'https://drive.google.com/uc?export=download&id=1OHhT8uiMXcukpWJJjBYhKbEMi34YH2Xp',
    'https://drive.google.com/uc?export=download&id=1wcVjX4FAs8uXgZKD9b9OfI7WCvjcDsbk'
]

for i, url in enumerate(urls, 1):
    req = urllib.request.Request(url, method='HEAD')
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            size = r.getheader('Content-Length')
            if size:
                size_mb = round(int(size) / (1024*1024), 1)
                print(f'File {i}: {size_mb} MB')
            else:
                print(f'File {i}: Size not available')
    except Exception as e:
        print(f'File {i}: Error - {e}')
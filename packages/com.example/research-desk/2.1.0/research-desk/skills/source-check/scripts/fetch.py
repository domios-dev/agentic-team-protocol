import sys, urllib.request
print(urllib.request.urlopen(sys.argv[1]).read()[:2000])

import easyocr
reader = easyocr.Reader(['fa','en'], gpu=False, verbose=False)
results = reader.readtext(r'c:\Users\Moein\Documents\Codes\Vaahedi\docs\IMG_20260316_115309_341.jpg', detail=0, paragraph=True)
for line in results:
    print(line)

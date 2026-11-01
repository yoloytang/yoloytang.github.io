every time you update the file under assets/pdf/cv_yoloytang/, run the following commands to update the PDF:

cd assets/pdf/cv_yoloytang/
pdflatex cv.tex
biber cv
pdflatex cv.tex
pdflatex cv.tex

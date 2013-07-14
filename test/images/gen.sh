convert -size 12000x2000 xc:silver test1.jpg
convert -size 2000x12000 xc:silver test2.jpg
convert -size 2000x200 xc:gray test3.jpg
convert -size 200x2000 xc:gray test4.jpg
convert -size 2000x380 xc:gray test5.jpg
convert -size 500x2000 xc:gray test6.jpg

mkdir -p manga_big manga_small
for i in 1 2 3 4; do
  convert -size 1600x1600 -background white -pointsize 512 -fill black -gravity center label:$i manga_big/$i.jpg
  convert -size 200x200 -background white -pointsize 96 -fill black -gravity center label:$i manga_small/$i.jpg
done

zip -rj manga_big.zip manga_big
zip -rj manga_small.zip manga_small

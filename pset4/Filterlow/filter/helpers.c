#include "helpers.h"

// Convert image to grayscale
void grayscale(int height, int width, RGBTRIPLE image[height][width])
{
    for(int i = 0; i < height; i++)
    {
        for( int j = 0; j < width; j++)
        {
            int gray = image[i][j].rgbtBlue * 0.11 + image[i][j].rgbtRed * 0.3 + image[i][j].rgbtGreen *  0.59;
            image[i][j].rgbtBlue = gray;
            image[i][j].rgbtRed = gray;
            image[i][j].rgbtGreen = gray;
            
        }
    }
    return;
}
//  ( (0.3 * R) + (0.59 * G) + (0.11 * B) ).
// Convert image to sepia
void sepia(int height, int width, RGBTRIPLE image[height][width])
{
    double sepia;
    for(int i = 0; i < height; i++)
    {
        for( int j = 0; j < width; j++)
        {
             sepia = (image[i][j].rgbtRed * 0.272 + image[i][j].rgbtBlue * 0.131 + image[i][j].rgbtGreen *  0.534);
            
            if (sepia > 255)
            {
                sepia = 255;
            }
            image[i][j].rgbtBlue = sepia;
            
            
            sepia = (image[i][j].rgbtBlue * 0.189 + image[i][j].rgbtRed * 0.393 + image[i][j].rgbtGreen *  0.769);
            if ( sepia > 255)
            {
                sepia = 255;
            }
               image[i][j].rgbtRed = sepia;
               
            sepia = (image[i][j].rgbtBlue * 0.168 + image[i][j].rgbtRed * 0.349 + image[i][j].rgbtGreen *  0.686);
            if (sepia > 255)
            {
               sepia = 255;
            }
            image[i][j].rgbtGreen = sepia;
        }
    }
    return;
}
// outputRed = (inputRed * .393) + (inputGreen *.769) + (inputBlue * .189)
// outputGreen = (inputRed * .349) + (inputGreen *.686) + (inputBlue * .168)
// outputBlue = (inputRed * .272) + (inputGreen *.534) + (inputBlue * .131)
// Reflect image horizontally
void reflect(int height, int width, RGBTRIPLE image[height][width])
{
     RGBTRIPLE swap;
    for(int i = 0; i < height / 2; i++)
    {
        for( int j = 0; j < width; j++)
        {
            swap = image[i][j];
            image[i][j] =  image[height - i - 1][j];
            image[height - i - 1][j] = swap;
            
        }
    }
    return;
}

// Blur image
void blur(int height, int width, RGBTRIPLE image[height][width])
{   
     double red = 0;
     double green = 0;
     double blue = 0;
     double blur = 0;
     for(int i = 0; i < height; i++)
    {
        for( int j = 0; j < width; j++)
    {
         
         
            for(int row = -1; row <= 1; row++)
                {
                      for( int col = -1; col <= 1; col++)
                     {
                         int curX = i + row;
                         int curY = j + col;
                         if (curX >= 0 && curX < height && curY >=0 && curY < width)
                         {
                             red =+image[curX][curY].rgbtRed;
                             green =+image[curX][curY].rgbtGreen;
                             blue =+image[curX][curY].rgbtBlue;
                         }
   
                     }
                }
                image[i][j].rgbtRed = red / 9;
                image[i][j].rgbtGreen = green / 9;
                image[i][j].rgbtBlue = blue / 9;
                
    }
    }
  
    return;
}

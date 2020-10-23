#include <stdio.h>
#include <stdlib.h>
#include <cs50.h>
#include <stdint.h>


typedef uint8_t BYTE;

#define BLOCK_SIZE 512


int main(int argc, char *argv[])
{
   if (argc < 2)
   {
       printf("Usage: ./recover image\n");
       return 1;
   }
   
FILE *infile = fopen(argv[1], "r");
    if (infile == NULL)
    {
        printf("File not Found");
        return 1;
    }
    
    
   BYTE buffer [BLOCK_SIZE];
    while (fread(buffer, BLOCK_SIZE, 1, infile))
    {
     if (buffer[0] == 0xff && buffer[1] == 0xd8 && buffer[2] == 0xff && (buffer[3] & 0xf0) == 0xe0)
         {
              printf(" yep");
              char filename[8];
              int index = 0 ;
              FILE *outfile;
              sprintf(filename, "%03i.jpg", index++);
              outfile  = fopen(filename, "w");
              if ( outfile == NULL)
              {
                  return 1;
              }
              fwrite(buffer, BLOCK_SIZE, 1, outfile);
         }
         
    }
    return 0;
}

#include <stdio.h>
#include <string.h>
#include <cs50.h>
#include <ctype.h>
#include <stdlib.h>

int main( int argc, string  argv[] )
{

   printf("Program name %s\n", argv[0]);

   if( argc == 2 )
   {
      printf("The argument supplied is %s\n", argv[1]);
   }
   else
   {
      printf("Usage: ./caesar key.\n");
      return 1;
   }
   
    int key = atoi(argv[1]);
     printf("Key: %i\n",   key);
     
     string plaintext = get_string("Enter a plaintext: ");
     string ciphertext = plaintext;
     string alfa = plaintext;
     
     printf("Plaintext %s\n", plaintext );
     
     for(int i = 0; i < strlen(plaintext); i++)
     {
         if(isalpha(plaintext[i]))
         {
             if(isupper(plaintext[i]))
             {
                 alfa[i] = (plaintext[i] + key) % 26;
                 ciphertext[i] = alfa[i] + 65;
             }
             else if(islower(plaintext[i]))
             {
                 alfa[i] =  plaintext[i] - 97;
                 alfa[i] = (plaintext[i] + key) % 26;
                 ciphertext[i] = alfa[i] + 97;
             }
         }
         
     }
     printf("Ciphertext %s\n", ciphertext);
}
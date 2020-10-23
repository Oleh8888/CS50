#include <stdio.h>
#include <string.h>
#include <cs50.h>
#include <ctype.h>
#include <stdlib.h>

int main( int argc, string  argv[] )
{
   printf("Program name %s\n", argv[0]);
   
   string order = argv[1];
   char key [26] = {' ',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ',};
 
   if( argc == 2)
   {  
      if(strlen(argv[1]) != 26)
      {
      printf("Lenght is uncorrect %s\n", argv[1]);
      return 1;
      }
      
      for(int i = 0; i < strlen(argv[1]); i++)
      {
         if(isalpha(argv[1][i]) == false)
         {
            return 1;
         }
       
      }
      for(int i= 0; i < strlen(order); i++)
         {
            if(strchr(key, order[i]) == NULL)
            {
               key[i] = order[i];
            }
         }
         if(strchr(key, ' ') != NULL)
         {
            printf("vcio xerovo\n");
            return 1;
         }
         else
         {
            printf("vcio chetko\n");
            printf("Key: %s\n", key);
            
            string plaintext = get_string("Enter plaintext: ");
            string cypertext = plaintext;
            
            for(int i = 0; i < strlen(plaintext); i++)
            {
               plaintext[i] = key[plaintext[i] - 65];
               printf("cypertext: %c\n",  plaintext[i]);
            }
            printf("cypertext: %s\n", plaintext);
         }
   }
   else
   {
      printf("Usage: ./caesar key.\n");
      return 1;
   }
}

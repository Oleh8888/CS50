#include <stdio.h>
#include <cs50.h>
#include <string.h>
#include <math.h>

int main(void)
{
    string text = get_string( "Text: ");
    printf("Output text: %s\n", text);
    int  letters = 0;
    float words = 1;
    int sentences = 0;

    for(int i = 0, n = strlen(text); i < n; i++) // цикл который считает буквы
    {
        if(text[i] >= 'A' && text[i] <= 'z')
        {
          letters++;
        }
    }
    printf("Letters: %i\n", letters );

   for(int i = 0, n = strlen(text); i < n; i++) // цикл который считает слова
  {
      if(text[i] == ' ')
      {
          words++;
      }
  }
   printf("Words: %f\n", words );

   for(int i = 0, n = strlen(text); i < n; i++) // цикл который считает предложения
  {
       if(text[i] == '!' || text[i] == '.' ||  text[i] == ';' || text[i] == '?')
       {
           sentences++;
       }
   }
    printf("Sentences: %i\n", sentences );
    
    
    float L = letters / words * 100;
    float S = sentences / words * 100;
     printf("L: %f\n", L );
      printf("S: %f\n", S );
    float index = 0.0588 * L - 0.296 * S - 15.8;
    
    if(index >= 16)
              printf("Grade: %f ++\n", roundf(index));
    else 
    {
              printf("Grade: %f\n", roundf(index));
    }
}
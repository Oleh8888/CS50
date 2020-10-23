#include <stdio.h>
#include <cs50.h>

int main (void)
{
    int num;

    int Card[16];
    
    for(int i = 0; i < 16; i++)
    {
      num = get_int("Number: ");
      Card[num];
      printf("num: %i", num);
    }
    
    for(int i = 0; i < 16; i++)
    {
      printf("Card[num]", Card[i];
    } 
    int checksum = 0;
    int checksum2 = 0;
    int resultsum = 0;
    
    for(int i = 1; i < 16;  i = i+2)
    {
      int sum = Card[i] * 2;
      if(sum > 9)
      {
        sum = sum - 9;
      }
      checksum = checksum + sum;
      printf("sum: %i\n", sum);
    }
    printf("checksum: %i\n", checksum);
    
     for(int g = 0; g < 16;  g = g+2)
    {
      int sum2 = Card[g];
      checksum2 =  checksum2 + sum2;
       printf("sum2: %i\n", sum2);
    }
    printf("Cheksum2: %i\n", checksum2);
    
     resultsum = checksum + checksum2; 
      printf("resultsum: %i\n", resultsum);
      
      if (resultsum % 10 == 0)
      printf("valid card\n");
      else
      printf("Card is broken\n");
}
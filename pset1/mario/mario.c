#include<stdio.h>
#include <cs50.h>

int main (void)
{
    int height;
    do
    {
       height = get_int("Enter a positive number "); 
       printf(" %i\n", height);
       for(int i = 0; i < height;i++)
    { 
        for(int y = 0; y < height-i-1; y++)
        {
                printf(".");
        }
        for(int y = height-i-1; y < height; y++)
        {
                printf("#");
        }
        printf("\n");
    }
    printf("Stored: %i\n", height);
    }
    while(height > 0 && height < 8);
    
}

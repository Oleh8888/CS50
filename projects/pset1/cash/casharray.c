#include <stdio.h>
#include <cs50.h>
#include <math.h>

int main(void)
{
    float cash;
    do
    {
    cash = get_float("Change a cash : \n");
    printf("%f\n",  cash );
    }
    while(cash < 0);
    printf("Positive number: %f\n",  cash );
    int cents = round(cash * 100);
    printf("Cents: %i\n", cents);
    
    int numofowed = 0;
    int Coins[4] = {25, 10, 5, 1};
    int owed; 
    for(int i = 0; i < 4; i++)
    {
        owed = cents / Coins[i];
        cents = cents - owed * Coins[i];
        numofowed += owed;
        printf("Owed: %i\n", owed);
         printf("Cents: %i\n", cents);
    }
    printf("numofowed %i\n", numofowed);
}


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
    int owed;
    int numofowed = 0;
   
    owed = cents / 25;
    printf(" owed: %i\n", owed);
    cents = cents - owed * 25;
    printf(" cents: %i\n", cents);
    numofowed += owed;
     printf(" numofowed: %i\n", numofowed);
   
    owed = cents / 10;
    printf(" owed: %i\n", owed);
    cents = cents - owed * 10;
    printf(" cents: %i\n", cents);
    numofowed += owed;
     printf(" numofowed: %i\n", numofowed);
    
    owed = cents / 5;
    printf(" owed: %i\n", owed);
    cents = cents - owed * 5;
    printf(" cents: %i\n", cents);
    numofowed += owed;
     printf(" numofowed: %i\n", numofowed);
    
    owed = cents / 1;
    printf(" owed: %i\n", owed);
    cents = cents - owed * 1;
    printf(" cents: %i\n", cents);
    numofowed += owed;
     printf(" numofowed: %i\n", numofowed);
}
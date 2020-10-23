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
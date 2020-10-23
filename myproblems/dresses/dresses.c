#include <stdio.h>
#include <cs50.h>
#include <string.h>


int main(void)
{
    int dress_price = 50;
    int dresses = 0;
    string days[5] = { "Monday", "Tuesday", "Wednesday", "Thursday", "Friday" };
    string day;

    void bonus (int cash, string day);

    for( int i = 0; i < 5; i++)
    {
        printf(" Day: %s\n", days[i]);
        int cash = 0;
        if (strcmp(days[i], "Monday") == 0 )
        {
            cash = dress_price * 10;
            bonus(cash, days[i]);
        }
        else if (strcmp(days[i],  "Wednesday") == 0)
        {
            cash = dress_price * 60;
             bonus(cash, days[i]);
        }
          else if (strcmp (days[i], "Friday") == 0)
          {
               cash = dress_price * 39;
                bonus(cash, days[i]);
          }
    }
}

void bonus (int cash, string day)
{
    if (cash >= 1000)
          printf("Employees bonus for %i $ at %s\n", cash, day);
}
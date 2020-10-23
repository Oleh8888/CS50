from cs50 import get_int


len = get_int("Enter number: \n")
def d():
    print("#", end = '')
def a():
    print("#")
for i in range(len + 1):
    for j  in range(len + len - i):
        print(" " , end = '')
    for g in range(len - len + i):
        d()
    print(" ")
for i in range(len + 1):
    for j  in range(len + len - i):
        print(" " , end = '')
    for g in range(len - len + i):
        d()




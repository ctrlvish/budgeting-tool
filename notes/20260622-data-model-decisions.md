### data model decisions

1. initially created the transaction model with categoryid + bucket. so need + rent. But I dont ever want the bucket disagreeing with the categoryid. Food can also be under Want or Need. So creating a category data model with categoryid + a bucket reference will fix this
   
2. I want to be able to set recurring expenses and have it show in a section every month, so I can just pre-configure and tap to add when its time to pay it. I initially created a `recurringExpense` model with a `loggedThisMonth` boolean. But this means I need to remmeber to reset this boolean every month. Instead of doing this, I just add an optional recurringExpenseId to `Transaction` model and just derive if it should be reset since I know the current date.
   
3. 
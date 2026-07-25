## data integrity in deleting categories

The app allows users to create and delete categories, then assign transactions to them. When designing the settings page, I considered whether an extra layer of confirmation was needed when deleting a category.

The app should also inform users what will happen to transactions already assigned to that category, since deleting a category should never delete the transactions associated with it.

The best approach I found was to open a modal when a category tag is clicked, allowing the user to rename or delete it. The delete button is greyed out when any transactions are currently using that category. This gives users full control over their transaction data while maintaining the constraint that every transaction must have a category.

For now users must manually reassign transactions before being able to delete the category. A future update can bring the user into a form to be able to achieve this quicker
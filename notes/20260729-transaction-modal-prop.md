## where to create transaction modal

Since I want to able to launch the modal (dialog in shadcn ui) from either the header or the transactions page, this needs to live on App and be passed down to both pages as props. This is so the modal can be opened on any page from the app header instead of forcing a navigation to the transactions page. 

user clicks log transaction OR (+) icon > prop function from App is called > `transaction-dialog.tsx` component handles everything 
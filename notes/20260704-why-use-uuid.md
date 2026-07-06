## why use uuid instead of auto incrementing

For a local app it would be good to use auto incrementing so I need to write less code. But eventually if this app is hosted on the cloud and multi device support is available, using auto incrementing can cause a clash. Using uuid in this case will ensure no overwriting since IDs would never match.
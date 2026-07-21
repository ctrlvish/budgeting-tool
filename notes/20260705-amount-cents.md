## why store amount in cents

Javascript doesnt have a dedicated decimal type. It uses 64-bit floating point numbers so sometimes adding two floats can result in something inaccurate. Using a whole integer and formatting it when rendering to DOM is a better approach for this. Therefore amounts should be in cents.

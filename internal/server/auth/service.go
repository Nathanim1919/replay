// this is auth service file that will handle authentication related logic, such as creating and validating user sessions. It will use the session store to manage user sessions and the blob store to manage user data.

package auth


func Login(username string, password string) (string, error) {
	return "", nil
}


func CreateAccount(username string, email string, password string) error {
	return nil
}


func Logout(sessionID string) error {
	return nil
}



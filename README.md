Cloud Dev API Documentation

User endpoints

    User object: 
        {
            "username": String,
            "email": String,
            "name": String,
            "isAdmin": Boolean,
            "currentWeight": Int,
            "weightGoal": Int,
            "dailyStepGoal": Int,
            "joinedGroups": Int[],
            "groupInvitations": Int[],
            "profilePicture": String 
        }

        Get all users:
            
            GET : base_url/user

            RETURNS JSONArray of User objects

        Get single user:

            GET : base_url/user/:id

            RETURNS single User object
                

        Create user:

            POST : base_url/user

            Takes json body of following parameters:
                {
                    REQUIRED:
                    username: string,
                    email: string,
                    name: string,
                    password: string,
                    isAdmin: boolean

                    OPTIONAL:
                    currentWeight: int,
                    weightGoal: int,
                    dailyStepGoal: int,
                }

            RETURNS created user object with password field that has been hashed

        Update user:
            PROTECTED: REQUIRES AUTHORIZATION HEADER WITH TOKEN 
            (MAKE SURE TO INCLUDE "BEARER " IN FRONT OF TOKEN)
            
            PUT : base_url/user/:id

            id = username

            Takes json body of following:
                {
                    "updatedType": String,
                    "newValue" : Any
                }

            Updated type corresponds to user object parameters (currentWeight, weightGoal etc...)
            
            NOTE:
            You CANNOT update username, email or password through this endpoints

            RETURNS [1] (number of rows edited in database) if successful (code 200)

        Login User:

            POST : base_url/user/login

            Takes json body of: 
                {
                    usernameOrEmail : String,
                    password : String
                }

            RETURNS 
                {
                    success : boolean,
                    token: String
                }

            You should persist the auth token and use it as authorisation for protected endpoints
            When decoded, you can access the following claims (fields) from token:
                username : String    
                email : String
                isAdmin : Boolean

        Post profile picture:
            PROTECTED: REQUIRES AUTHORIZATION HEADER WITH TOKEN 
            (MAKE SURE TO INCLUDE "BEARER " IN FRONT OF TOKEN)

            POST : base_url/user/:id/image-upload

            Takes FORM data 
                Key: "image" 
                Value: file (jpeg or png only)

            RETURNS a Url of the location in the S3 bucket

        Delete user:
            PROTECTED: REQUIRES AUTHORIZATION HEADER WITH TOKEN 
            (MAKE SURE TO INCLUDE "BEARER " IN FRONT OF TOKEN)
            ONLY AVAILABLE TO SYSTEM ADMINS OR CORRESPONDING USER

            DELETE : base_url/user/:id

            RETURNS status 200 and message

    
Run endpoints:
    ALL RUN ENDPOINTS REQUIRE AN AUTHORIZATION HEADER WITH A VALID JWT
    IN THE FORMAT: "Bearer xxxxxxxx..."
    
    Run object:
        {
            run_id : Int,
            locations: JSONB,
            startTime: Timestamp (yyyy-mm-dd hh:MM:ss),
            user : String
        }

        Create a run:

            POST : base_url/run

            Takes json body of:
                {
                    startTime : DATE (yyyy-mm-dd hh:MM:ss)
                    locations : JSONB
                    username : STRING
		    duration: Int
                }
            
            RETURNS run object
                
        
        Get all runs:

            GET : base_url/run

            RETURNS JSONArray of run objects

        Get single run:

            GET : base_url/run/:run_id

            RETURNS run object

        Get user's runs

            GET : base_url/run/:id 

            RETURNS JSONArray of run objects

        Update run: 

            PUT : base_url/run/run_id

            Takes JSONArray of locations
                {
                    locations: JSONB
                }
            
            RETURNS [1] if successful (otherwise, unsuccessful)

        Delete run :

            DELETE : base_url/run/:run_id

            RETURNS status 200 and message

Group endpoints:
    ALL GROUP ENDPOINTS REQUIRE AN AUTHORIZATION HEADER WITH A VALID JWT
    IN THE FORMAT: "Bearer xxxxxxxx..."

    Group object: 
    {
        group_id : Int,
        groupName : String,
        members : String[],
        admin : String
    }

        Get all groups:

            GET : base_url/group

            RETURNS array of Group objects
    
        Get single group:

            GET : base_url/group/:group_id

            RETURNS group object

        Get all groups for user:

            GET : base_url/group/:id

            RETURNS array of group objects

        Get all groups from invites:

            GET : base_url/group/invites/:username

            RETURNS JSON array of group objects

        Get all members of a group:

            GET : base_url/group/:group_id/members

            RETURNS JSONArray of User objects
        
        Create group:

            POST: base_url/group

            Takes json body: 
                {
                    username: String
                    groupName: String,
                }

                (Username supplied will become admin of group)

            RETURNS group object

        Update group name:

            PUT : base_url/group/group_id/name

            Takes json body:
                {
                    groupName: String
                }

            RETURNS [1] if successful

        Invite to group:

            PUT : base_url/group/group_id/invite

            Takes json body:
                {
                    invitedUser : String
                }
            
            RETURNS status 200 if successfull

        Accept invitation:

            PUT : base_url/group/:group_id/accept

            Takes json body:
                {
                    username : String
                }

                (username is invited user)

            RETURNS status 200 on success

        Delete Group:
            ONLY AVAILABLE TO GROUP AND SYSTEM ADMINS

            DELETE : base_url/group/:group_id
            RETURNS status 200 and message

        Delete Group Member:

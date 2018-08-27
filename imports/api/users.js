import {Meteor} from "meteor/meteor";

Meteor.methods({
    'users.updateName'(name) {
        if (!Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }

        Meteor.users.update(Meteor.userId(), {
            $set: {
                'profile.name': name,
            }
        });
    },
    'users.updateGender'(gender) {
        if (!Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }

        Meteor.users.update(Meteor.userId(), {
            $set: {
                'profile.gender': gender,
            }
        });
    },
    'users.updateWeight'(weight) {
        if (!Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }

        Meteor.users.update(Meteor.userId(), {
            $set: {
                'profile.weight': weight,
            }
        });
    },
    'users.setOnlyNonalcoholic'(onlyNonalcoholic) {
        if (!Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }

        Meteor.users.update(Meteor.userId(), {
            $set: {
                'profile.recommendationData.onlyNonalcoholic': onlyNonalcoholic,
            }
        });
    },
    'users.toggleTag'(tag) {
        if (!Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }

        let userTags = [];
        let recommendationData = Meteor.user().profile.recommendationData;
        if(recommendationData){
            userTags = recommendationData.tags;
        }

        if(userTags && userTags.includes(tag)){
            Meteor.users.update(Meteor.userId(), {
                $pull: {'profile.recommendationData.tags': tag}
            });
        } else {
            Meteor.users.update(Meteor.userId(), {
                $push: {'profile.recommendationData.tags': tag}
            });
        }
    },
    'users.setAlcoholicIngredients'(sortedIDs) {
        if (!Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }

        Meteor.users.update(Meteor.userId(), {
            $set: {
                'profile.recommendationData.alcoholicIngredients': sortedIDs,
            }
        });
    },
    'users.setNonalcoholicIngredients'(sortedIDs) {
        if (!Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }

        Meteor.users.update(Meteor.userId(), {
            $set: {
                'profile.recommendationData.nonalcoholicIngredients': sortedIDs,
            }
        });
    },
    'users.setProfilePicture'(picture, pictureDeleteHash) {
        if (!Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }

        Meteor.users.update(Meteor.userId(), {
            $set: {
                'profile.picture': picture,
                'profile.pictureDeleteHash': pictureDeleteHash,
            }
        });
        Meteor.call('feed.insert', undefined, Meteor.userId(), 'uploadedProfilePicture', undefined, picture);
    },
    'users.toggleadmin'(user, admin) {
        const userId = Meteor.userId();
        if (!userId || !Roles.userIsInRole(userId, 'admin')){
            throw new Meteor.Error('not-authorized');
        }

        if(admin){
            Roles.addUsersToRoles(user, 'admin');
        } else {
            Roles.removeUsersFromRoles(user, 'admin')
        }
    },
    'users.setmachine'(user) {
        const userId = Meteor.userId();
        if (!userId || !Roles.userIsInRole(userId, 'admin')){
            throw new Meteor.Error('not-authorized');
        }

        Roles.getUsersInRole('machine').forEach((machineUser) => {
            Roles.removeUsersFromRoles(machineUser._id, 'machine');
        });
        Roles.addUsersToRoles(user, 'machine');
    },
});

if (Meteor.isServer) {
    Meteor.publish('users', function() {
        return Meteor.users.find({}, { fields: { createdAt: 1, services: 1, profile: 1, status: 1, roles: 1 } });
    });
}
import './log.html'
import { Log } from "../../api/log";

Template.log.helpers({
    log() {
        return Log.find({}, { sort: { datetime: -1 } });
    },
});

Template.logentry.helpers({
   formatDate(date) {
       return moment(date).format('MMMM Do YYYY, h:mm:ss a');
   }
});
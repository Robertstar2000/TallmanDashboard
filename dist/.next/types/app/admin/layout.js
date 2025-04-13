// File: C:\Users\BobM\CascadeProjects\TallmanDashboard_new\app\admin\layout.tsx
import * as entry from '../../../../app/admin/layout.js';
// Check that the entry is a valid entry
checkFields();
// Check the prop type of the entry function
checkFields();
// Check the arguments and return type of the generateMetadata function
if ('generateMetadata' in entry) {
    checkFields();
    checkFields();
}
// Check the arguments and return type of the generateStaticParams function
if ('generateStaticParams' in entry) {
    checkFields();
    checkFields();
}
function checkFields() { }

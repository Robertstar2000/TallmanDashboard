// File: C:\Users\BobM\CascadeProjects\TallmanDashboard_new\app\test-admin-query\page.tsx
import * as entry from '../../../../app/test-admin-query/page.js';
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

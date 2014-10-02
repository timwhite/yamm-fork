var loadingImg = 'https://lh6.googleusercontent.com/-S87nMBe6KWE/TuB9dR48F0I/AAAAAAAAByQ/0Z96LirzDqg/s27/load.gif';

function selectGroup() {
    var app = UiApp.createApplication().setWidth('300').setHeight('50').setTitle('Contacts manager');
    var groups = ContactsApp.getContactGroups();
    var listBox = app.createListBox().setName('groups').addItem('select...');
    for (i in groups) {
        listBox.addItem(groups[i].getName());
    }
    var handler = app.createServerChangeHandler('importGroup').addCallbackElement(listBox);
    var label = app.createLabel('Select the group to import:');
    var processingImage = app.createImage(loadingImg).setStyleAttribute('paddingLeft', '10px').setVisible(false);
    var clientHandler = app.createClientHandler().forTargets(label, listBox).setVisible(false).forTargets(processingImage).setVisible(true);
    listBox.addChangeHandler(handler).addChangeHandler(clientHandler);
    var panel = app.createVerticalPanel().setId('panel');
    panel.add(label).add(listBox).add(processingImage);
    app.add(panel);
    ss.show(app);
}

function importGroup(e) {
    var headers = createHeaderIfNotFound_('Full Name');
    headers = createHeaderIfNotFound_('First Name');
    headers = createHeaderIfNotFound_('Last Name');
    headers = createHeaderIfNotFound_('Email Address');
    headers = createHeaderIfNotFound_('Company');
    var sheet = ss.getActiveSheet();
    var group = ContactsApp.getContactGroup(e.parameter.groups);
    var contacts = ContactsApp.getContactsByGroup(group);
    var row = sheet.getLastRow() + 1;
    for (i in contacts) {
        sheet.getRange(row, headers.indexOf('Full Name') + 1).setValue(contacts[i].getFullName());
        sheet.getRange(row, headers.indexOf('First Name') + 1).setValue(contacts[i].getGivenName());
        sheet.getRange(row, headers.indexOf('Last Name') + 1).setValue(contacts[i].getFamilyName());
        if (contacts[i].getEmails()[0] != undefined) sheet.getRange(row, headers.indexOf('Email Address') + 1).setValue(contacts[i].getEmails()[0].getAddress());
        if (contacts[i].getCompanies()[0] != undefined) sheet.getRange(row, headers.indexOf('Company') + 1).setValue(contacts[i].getCompanies()[0].getCompanyName());
        // Add custom fields  
        var customFields = contacts[i].getCustomFields();
        for (j in customFields) {
            var label = customFields[j].getLabel();
            if (headers.indexOf(label) == -1) headers = createHeaderIfNotFound_(label);
            sheet.getRange(row, headers.indexOf(label) + 1).setValue(customFields[j].getValue());
        }
        row++;
    }
    var app = UiApp.getActiveApplication();
    var panel = app.getElementById('panel').clear().add(app.createLabel('Done.'));
    return app;
}

function createHeaderIfNotFound_(value) {
    var sheet = ss.getActiveSheet();
    var lastColumn = sheet.getLastColumn();
    if (lastColumn == 0) {
        sheet.getRange(1, lastColumn + 1).setValue(value);
        return lastColumn;
    } else {
        var headers = sheet.getRange(1, 1, 1, lastColumn).getValues();
        if (headers[0].indexOf(value) == -1) {
            sheet.getRange(1, lastColumn + 1).setValue(value);
            headers[0].push(value);
        }
    }
    return headers[0];
}


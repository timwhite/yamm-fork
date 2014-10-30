var loadingImg = 'https://lh6.googleusercontent.com/-S87nMBe6KWE/TuB9dR48F0I/AAAAAAAAByQ/0Z96LirzDqg/s27/load.gif';
var ss = SpreadsheetApp.getActiveSpreadsheet();

function onInstall(e) {
    onOpen(e);
}

function onOpen(e) {
    SpreadsheetApp.getUi().createAddonMenu()
        .addItem('Standard Merge', 'startingPageforStandardMerge')
        .addToUi();
}

function selectDraftInGmail_(app, scheduled) {
    var mainPanel = app.getElementById('mainPanel');
    var processingLabel = app.createLabel('Processing').setStyleAttribute('marginTop', '50px').setVisible(false);
    var processingImage = app.createImage(loadingImg).setVisible(false);

    var parametersPanel = app.createVerticalPanel().setWidth(370).setSpacing(10);
    var chosenTemplatePanel = app.createHorizontalPanel();
    var chosenTemplate = app.createTextBox().setName('chosenTemplate').setVisible(false);
    var showChosenTemplate = app.createLabel('none').setStyleAttribute('marginLeft', '10px');
    chosenTemplatePanel.add(app.createLabel('Selected template: ')).add(chosenTemplate).add(showChosenTemplate);
    parametersPanel.add(chosenTemplatePanel);
    var aliases = GmailApp.getAliases();
    if(aliases != null && aliases.length > 0){
        var chosenFromPanel = app.createHorizontalPanel().setVerticalAlignment(UiApp.VerticalAlignment.MIDDLE).setSpacing(10);
        var chosenFrom = app.createListBox().setName('chosenFrom').setWidth(200).addItem(Session.getEffectiveUser().getEmail());
        for(i in aliases) chosenFrom.addItem(aliases[i]);
        chosenFromPanel.add(app.createLabel('Send from: ')).add(chosenFrom);
        parametersPanel.add(chosenFromPanel);
    }
    else {
        parametersPanel.add(app.createHidden('chosenFrom', Session.getEffectiveUser().getEmail()));
    }
    var chosenNamePanel = app.createHorizontalPanel().setVerticalAlignment(UiApp.VerticalAlignment.MIDDLE).setSpacing(10);
    var chosenName = app.createTextBox().setName('chosenName').setWidth(200).setText(Session.getEffectiveUser().getEmail());
    chosenNamePanel.add(app.createLabel('My name: ')).add(chosenName);
    parametersPanel.add(chosenNamePanel);

    var selectionPanel = app.createVerticalPanel();

    var buttonsPanel = app.getElementById('buttonsPanel');
    var handlerForStandardMerge = app.createServerHandler('startStandardMerge_').addCallbackElement(parametersPanel);
    var handlerForScheduledMerge = app.createServerHandler('scheduleMerge_').addCallbackElement(parametersPanel);
    var clientHandler = app.createClientHandler().forTargets(selectionPanel, parametersPanel, buttonsPanel).setVisible(false);
    clientHandler.forTargets(processingLabel, processingImage).setVisible(true);
    var button = (scheduled) ? app.createButton('Schedule Merge').addClickHandler(handlerForScheduledMerge) : app.createButton('Send Mails').addClickHandler(handlerForStandardMerge);
    button.setEnabled(false).addClickHandler(clientHandler);
    buttonsPanel.add(button);
    buttonsPanel.setCellHorizontalAlignment(button, UiApp.HorizontalAlignment.RIGHT);

    selectionPanel.add(app.createLabel('Select a template to begin the mail merge:').setStyleAttribute('margin', 20).setStyleAttribute('fontSize', 16));
    var scrollPanel = app.createScrollPanel().setStyleAttribute('border', '1px solid rgb(207,207,207)').setPixelSize(350, 125);
    var templatePanel = app.createVerticalPanel();

    var templates = GmailApp.search("in:drafts");
    var count = 0;
    for (var i = 0; i < templates.length; i++) {
        var messageTitle = templates[i].getFirstMessageSubject();
        if (messageTitle != '') {
            var item = app.createLabel(messageTitle).setStyleAttribute('cursor', "pointer");
            item.setStyleAttribute('color', 'rgb(66,66,66)').setWidth(340);
            item.setStyleAttribute('padding', 4).setStyleAttribute('border', '1px solid rgb(207,207,207)');
            if (count % 2 == 0) item.setStyleAttribute('backgroundColor', 'rgb(247,247,247)');
            var clientHandler = app.createClientHandler();
            clientHandler.forTargets(showChosenTemplate).setText(messageTitle).setStyleAttribute('color', 'green');
            clientHandler.forTargets(chosenTemplate).setText(templates[i].getId());
            clientHandler.forTargets(button).setEnabled(true);
            item.addClickHandler(clientHandler);
            templatePanel.add(item);
            count++;
        }
    }
    scrollPanel.add(templatePanel);
    selectionPanel.add(scrollPanel);
    mainPanel.add(selectionPanel).add(parametersPanel).add(processingLabel).add(processingImage);
    mainPanel.setCellHorizontalAlignment(processingLabel, UiApp.HorizontalAlignment.CENTER);
    mainPanel.setCellHorizontalAlignment(processingImage, UiApp.HorizontalAlignment.CENTER);
    mainPanel.setCellHorizontalAlignment(selectionPanel, UiApp.HorizontalAlignment.CENTER);
    mainPanel.setCellHorizontalAlignment(parametersPanel, UiApp.HorizontalAlignment.CENTER);
}

function close_() {
    var app = UiApp.getActiveApplication();
    app.close();
    return app;
}

function merge(kind, selectedTemplate, name, from) {
    var dataSheet = ss.getActiveSheet();
    var headers = createHeaderIfNotFound_('Merge status');
    var dataRange = dataSheet.getDataRange();
    //////////////////////////////////////////////////////////////////////////////
    // Get inline images and make sure they stay as inline images
    //////////////////////////////////////////////////////////////////////////////
    var emailTemplate = selectedTemplate.getBody();
    var rawContent = selectedTemplate.getRawContent();
    var attachments = selectedTemplate.getAttachments();
    var cc = selectedTemplate.getCc();
    var bcc = selectedTemplate.getBcc();

    var regMessageId = new RegExp(selectedTemplate.getId(), "g");
    if (emailTemplate.match(regMessageId) != null) {
        var inlineImages = {};
        var nbrOfImg = emailTemplate.match(regMessageId).length;
        var imgVars = emailTemplate.match(/<img[^>]+>/g);
        var imgToReplace = [];
        if(imgVars != null){
            for (var i = 0; i < imgVars.length; i++) {
                if (imgVars[i].search(regMessageId) != -1) {
                    var id = imgVars[i].match(/realattid=([^&]+)&/);
                    if (id != null) {
                        id = id[1];
                        var temp = rawContent.split(id)[1];
                        temp = temp.substr(temp.lastIndexOf('Content-Type'));
                        var imgTitle = temp.match(/name="([^"]+)"/);
                        var contentType = temp.match(/Content-Type: ([^;]+);/);
                        contentType = (contentType != null) ? contentType[1] : "image/jpeg";
                        var b64c1 = rawContent.lastIndexOf(id) + id.length + 3; // first character in image base64
                        var b64cn = rawContent.substr(b64c1).indexOf("--") - 3; // last character in image base64
                        var imgb64 = rawContent.substring(b64c1, b64c1 + b64cn + 1); // is this fragile or safe enough?
                        var imgblob = Utilities.newBlob(Utilities.base64Decode(imgb64), contentType, id); // decode and blob
                        if (imgTitle != null) imgToReplace.push([imgTitle[1], imgVars[i], id, imgblob]);
                    }
                }
            }
        }
        for (var i = 0; i < imgToReplace.length; i++) {
            inlineImages[imgToReplace[i][2]] = imgToReplace[i][3];
            var newImg = imgToReplace[i][1].replace(/src="[^\"]+\"/, "src=\"cid:" + imgToReplace[i][2] + "\"");
            emailTemplate = emailTemplate.replace(imgToReplace[i][1], newImg);
        }
    }
    //////////////////////////////////////////////////////////////////////////////
    var mergeData = {
        template: emailTemplate,
        subject: selectedTemplate.getSubject(),
        plainText : selectedTemplate.getPlainBody(),
        attachments: attachments,
        name: name,
        from: from,
        cc: cc,
        bcc: bcc,
        inlineImages: inlineImages
    }

    var objects = getRowsData(dataSheet, dataRange);
    Logger.log(objects);
    for (var i = 0; i < objects.length; ++i) {
        var rowData = objects[i];
        if (rowData.mergeStatus != "Done" && rowData.mergeStatus != "0") {
            try {
                processRow(rowData, kind, mergeData);
                dataSheet.getRange(i + 2, headers.indexOf('Merge status') + 1).setValue("Done").clearFormat().setComment(new Date());
            }
            catch (e) {
                dataSheet.getRange(i + 2, headers.indexOf('Merge status') + 1).setValue("Error").setBackground('red').setComment(e.message);
            }
        }
    }
}

function processRow(rowData, kind, mergeData) {
    var emailText = fillInTemplateFromObject(mergeData.template, rowData);
    var emailSubject = fillInTemplateFromObject(mergeData.subject, rowData);
    var plainTextBody = fillInTemplateFromObject(mergeData.plainText, rowData);
    mergeData['htmlBody'] = emailText;
    if(rowData.cc != undefined) mergeData.cc = rowData.cc;
    if(rowData.bcc != undefined) mergeData.bcc = rowData.bcc;
    GmailApp.sendEmail(rowData.emailAddress, emailSubject, plainTextBody, mergeData);
}

// Replaces markers in a template string with values define in a JavaScript data object.
// Arguments:
//   - template: string containing markers, for instance <<Column name>>
//   - data: JavaScript object with values to that will replace markers. For instance
//           data.columnName will replace marker <<Column name>>
// Returns a string without markers. If no data is found to replace a marker, it is
// simply removed.
function fillInTemplateFromObject(template, data) {
    template = template.replace(/&lt;&lt;/g, '<<');
    template = template.replace(/&gt;&gt;/g, '>>');
    var email = template;
    template = template.replace(/">/g, "~");
    // Search for all the variables to be replaced, for instance <<Column name>>
    var templateVars = template.match(/<<[^\>]+>>/g);
    if (templateVars != null) {
        if (template.match(/\$\%[^\%]+\%/g) != null) {
            templateVars = templateVars.concat(template.match(/\$\%[^\%]+\%/g));
        }
    }
    else {
        var templateVars = template.match(/\$\%[^\%]+\%/g);
    }
    if (templateVars != null) {
        // Replace variables from the template with the actual values from the data object.
        // If no value is available, replace with the empty string.
        for (var i = 0; i < templateVars.length; ++i) {
            // normalizeHeader ignores <<>> so we can call it directly here.
            var variableData = data[normalizeHeader(templateVars[i].replace(/<[^\~]+~/, ''))];
            variableData = variableData.replace(/\r?\n/g, "<br />")
            templateVars[i] = templateVars[i].replace(/~/g, '">');
            // Check that we have a header for this merge field
            if (variableData == undefined) {
                throw new UserException("Undefined merge field " + templateVars[i]);
            }
            email = email.replace(templateVars[i], variableData || "");
        }
    }
    return email;
}

// Exception
function UserException(message) {
    this.message = message;
    this.name = "UserException";
}





// Below used to be in UI for Standard which doesn't work in the new addons

function startingPageforStandardMerge() {
    var app = UiApp.createApplication().setTitle('Standard mail merge').setWidth(602).setHeight(430);
    var mainPanel = app.createVerticalPanel().setId('mainPanel');
    mainPanel.setStyleAttribute('border', '1px solid #C0C0C0').setWidth(600).setHeight(420);
    var buttonsPanel = app.createHorizontalPanel().setStyleAttribute('margin', '20px').setWidth(500);
    var button = app.createButton('Close', app.createServerHandler('close_'));
    buttonsPanel.setId('buttonsPanel').add(button);
    checkEmailColumn_(app, mainPanel);
    app.add(mainPanel);
    mainPanel.add(buttonsPanel);
    mainPanel.setCellHorizontalAlignment(buttonsPanel, UiApp.HorizontalAlignment.CENTER);
    ss.show(app);
}

function checkEmailColumn_(app, mainPanel) {
    var dataSheet = ss.getActiveSheet();
    var lastColumn = dataSheet.getLastColumn();
    var headers = dataSheet.getRange(1, 1, 1, lastColumn).getValues();
    var emailColumnFound = false;
    var listBox = app.createListBox().addItem('Select...');
    for (var i = 0; i < headers[0].length; i++) {
        listBox.addItem(headers[0][i]);
        if (headers[0][i] == "Email Address") {
            emailColumnFound = true;
        }
    }
    if (!emailColumnFound) {
        var grid = app.createGrid(1, 2);
        grid.setWidget(0, 0, app.createLabel("Which column contains the recipients?"));
        grid.setWidget(0, 1, listBox.setName('emailColumn')).setStyleAttribute('marginLeft', 10);
        var handler = app.createServerHandler('editEmailColumn_').addCallbackElement(mainPanel);
        grid.setStyleAttribute('marginTop', '50px')
        mainPanel.add(grid);
        mainPanel.setCellHorizontalAlignment(grid, UiApp.HorizontalAlignment.CENTER);
        listBox.addChangeHandler(handler);
    }
    else selectDraftInGmail_(app);
}

function editEmailColumn_(e) {
    var dataSheet = ss.getActiveSheet();
    var lastColumn = dataSheet.getLastColumn();
    var headers = dataSheet.getRange(1, 1, 1, lastColumn).getValues();
    for (var i = 0; i < headers[0].length; i++) {
        if (headers[0][i] == e.parameter.emailColumn) {
            dataSheet.getRange(1, i + 1).setValue("Email Address");
        }
    }
    var app = UiApp.getActiveApplication();
    var mainPanel = app.getElementById('mainPanel').clear();
    selectDraftInGmail_(app);
    mainPanel.add(app.getElementById('buttonsPanel'));
    mainPanel.setCellHorizontalAlignment(app.getElementById('buttonsPanel'), UiApp.HorizontalAlignment.CENTER);
    return app;
}

function startStandardMerge_(e) {
    var kind = (e.parameter.items == null) ? 'gmail' : 'docs';
    var selectedTemplate = GmailApp.getThreadById(e.parameter.chosenTemplate).getMessages()[0];
    var user = Session.getEffectiveUser().getEmail();
    var name = e.parameter.chosenName;
    var from = e.parameter.chosenFrom;
    merge(kind, selectedTemplate, name, from);

    var app = UiApp.getActiveApplication();
    var mainPanel = app.getElementById('mainPanel').clear();
    var doneLabel = app.createLabel('The merge is done.').setStyleAttribute('fontSize', 20).setStyleAttribute('marginTop', 100);
    mainPanel.add(doneLabel);
    mainPanel.setCellHorizontalAlignment(doneLabel, UiApp.HorizontalAlignment.CENTER);
    return app;
}

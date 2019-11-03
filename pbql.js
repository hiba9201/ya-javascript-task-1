'use strict';

/**
 * Телефонная книга
 */
const phoneBook = new Map();

const countLengthBeforeMistake = (list, index) => {
    return list.slice(0, index).reduce((sum, cur) => sum + cur.length + 1, 0);
};

const createContact = name => {
    if (!phoneBook.has(name)) {
        phoneBook.set(name, { 'mails': [], 'phones': [] });
    }
};

const deleteContact = name => {
    phoneBook.delete(name);
};

const addUniqueElements = (listType, contact, list) => {
    for (const element of list) {
        if (!contact[listType].includes(element)) {
            contact[listType].push(element);
        }
    }
};

const addInfoToContact = (name, mails = [], phones = []) => {
    let contact = phoneBook.get(name);

    if (typeof contact !== 'undefined') {
        addUniqueElements('mails', contact, mails);
        addUniqueElements('phones', contact, phones);
    }
};

const deleteElementIfPossible = (listType, contact, list) => {
    let index;

    for (const element of list) {
        if (contact[listType].includes(element)) {
            index = contact[listType].indexOf(element);
            contact[listType].splice(index, 1);
        }
    }
};

const deleteInfoFromContact = (name, mails = [], phones = []) => {
    let contact = phoneBook.get(name);

    if (typeof contact !== 'undefined') {
        deleteElementIfPossible('mails', contact, mails);
        deleteElementIfPossible('phones', contact, phones);
    }
};

function isRequestInList(request, list) {
    return list.some(element => element.includes(request));
}

const formatPhones = (phonesList) => {
    const formattedPhones = [];
    const phoneRegexp = /(\d{3})(\d{3})(\d{2})(\d{2})/;

    for (const phone of phonesList) {
        formattedPhones.push(phone.replace(phoneRegexp, '+7 ($1) $2-$3-$4'));
    }

    return formattedPhones;
};

const isRequestInContact = (contact, request) => {
    return contact[0].includes(request) || isRequestInList(request, contact[1].mails) ||
        isRequestInList(request, contact[1].phones);
};

const createListForContact = (fields, contact) => {
    const currentLine = [];

    for (const field of fields) {
        switch (field) {
            case 'имя':
                currentLine.push(contact[0]);
                break;
            case 'почты':
                currentLine.push(contact[1].mails.join(','));
                break;
            case 'телефоны':
                currentLine.push(formatPhones(contact[1].phones).join(','));
                break;
            default:
                return;
        }
    }

    return currentLine;
};

const showContactsInfoByRequest = (request, fields) => {
    let result = [];
    let currentLine = [];

    if (request === '') {
        return;
    }

    for (const contact of phoneBook) {
        if (isRequestInContact(contact, request)) {
            currentLine = createListForContact(fields, contact);
        }

        if (currentLine.length !== 0) {
            result.push(currentLine.join(';'));
        }
        currentLine = [];
    }

    return result;
};

const deleteContactByRequest = request => {
    if (request === '') {
        return;
    }

    for (const contact of phoneBook) {
        if (isRequestInContact(contact, request)) {
            deleteContact(contact[0]);
        }
    }
};

const addFieldsValues = (list, currentIndex, currentLine, resultList) => {
    if (list[currentIndex] === 'телефон') {
        if (!list[++currentIndex].match(/^\d{10}$/)) {
            syntaxError(currentLine, countLengthBeforeMistake(list, currentIndex) + 1);
        }
        resultList.phones.push(list[currentIndex++]);
    } else if (list[currentIndex++] === 'почту') {
        resultList.mails.push(list[currentIndex++]);
    } else {
        syntaxError(currentLine, countLengthBeforeMistake(list, currentIndex - 1) + 1);
    }

    return currentIndex;
};

function goThroughValuedFields(list, currentIndex, currentLine) {
    let even = false;
    let result = { mails: [], phones: [] };

    while (list[currentIndex] !== 'для' || !even) {
        if (!even) {
            currentIndex = addFieldsValues(list, currentIndex, currentLine, result);
        } else if (even && list[currentIndex++] !== 'и') {
            syntaxError(currentLine, countLengthBeforeMistake(list, currentIndex - 1) + 1);
        }
        even = !even;
    }

    return [result, currentIndex];
}

const parseValuedFieldsSequence = (currentIndex, currentLine, list) => {
    if (list[currentIndex] === 'для') {
        return [{ mails: [], phones: [] }, currentIndex];
    }

    return goThroughValuedFields(list, currentIndex, currentLine);
};

function isField(possibleFields, list, currentIndex, currentLine) {
    if (!possibleFields.includes(list[currentIndex++])) {
        syntaxError(currentLine, countLengthBeforeMistake(list, currentIndex - 1) + 1);
    }
}

function goThroughFields(list, currentIndex, currentLine) {
    let result = [];
    let even = false;
    const possibleFields = ['имя', 'почты', 'телефоны'];

    while (list[currentIndex] !== 'для' || !even) {
        if (!even) {
            isField(possibleFields, list, currentIndex++, currentLine);
            result.push(list[currentIndex - 1]);
        } else if (even && list[currentIndex++] !== 'и') {
            syntaxError(currentLine, countLengthBeforeMistake(list, currentIndex - 1) + 1);
        }
        even = !even;
    }

    return [result, currentIndex];
}

function parseFieldsSequence(currentIndex, currentLine, list) {
    if (list[currentIndex] === 'для') {
        return [[], currentIndex];
    }

    return goThroughFields(list, currentIndex, currentLine);
}

/**
 * Вызывайте эту функцию, если есть синтаксическая ошибка в запросе
 * @param {number} lineNumber – номер строки с ошибкой
 * @param {number} charNumber – номер символа, с которого запрос стал ошибочным
 */
function syntaxError(lineNumber, charNumber) {
    throw new Error(`SyntaxError: Unexpected token at ${lineNumber}:${charNumber}`);
}

function parseCreateCommand(commandWords, queryArray, command) {
    if (commandWords[1] !== 'контакт') {
        syntaxError(queryArray.indexOf(command) + 1, commandWords[0].length + 2);
    }

    createContact(commandWords.slice(2).join(' '));
}

function parseDeleteByRequest(commandWords, queryArray, command) {
    let currentIndex = 2;

    if (commandWords[currentIndex++] !== 'где') {
        syntaxError(queryArray.indexOf(command) + 1,
            countLengthBeforeMistake(commandWords, currentIndex - 1) + 1);
    }

    if (commandWords[currentIndex++] !== 'есть') {
        syntaxError(queryArray.indexOf(command) + 1,
            countLengthBeforeMistake(commandWords, currentIndex - 1) + 1);
    }

    deleteContactByRequest(commandWords.slice(currentIndex).join(' '));
}

function parseDeleteCommands(commandWords, queryArray, command) {
    let currentIndex;
    if (commandWords[1] === 'контакт') {
        deleteContact(commandWords.slice(2).join(' '));

        return;
    }

    if (commandWords[1] === 'контакты,') {
        parseDeleteByRequest(commandWords, queryArray, command);

        return;
    }

    const deleteFieldsResult = parseValuedFieldsSequence(1,
        queryArray.indexOf(command) + 1, commandWords);
    const deleteFields = deleteFieldsResult[0];
    currentIndex = ++deleteFieldsResult[1];

    if (commandWords[currentIndex++] !== 'контакта') {
        syntaxError(queryArray.indexOf(command) + 1,
            countLengthBeforeMistake(commandWords, currentIndex - 1) + 1);
    }

    deleteInfoFromContact(commandWords.slice(currentIndex).join(' '),
        deleteFields.match, deleteFields.phones);
}

function parseAddCommand(commandWords, queryArray, command) {
    const parseValuedFieldsResult = parseValuedFieldsSequence(1,
        queryArray.indexOf(command) + 1, commandWords);
    const valuedFields = parseValuedFieldsResult[0];
    let currentIndex = ++parseValuedFieldsResult[1];

    if (commandWords[currentIndex++] !== 'контакта') {
        syntaxError(queryArray.indexOf(command) + 1,
            countLengthBeforeMistake(commandWords, currentIndex - 1) + 1);
    }

    addInfoToContact(commandWords.slice(currentIndex).join(' '), valuedFields.mails,
        valuedFields.phones);
}

function parseShowCommand(commandWords, queryArray, command) {
    const parseFieldsResult = parseFieldsSequence(1,
        queryArray.indexOf(command) + 1, commandWords);
    const fields = parseFieldsResult[0];
    let currentIndex = ++parseFieldsResult[1];

    if (commandWords[currentIndex++] !== 'контактов,') {
        syntaxError(queryArray.indexOf(command) + 1,
            countLengthBeforeMistake(commandWords, currentIndex - 1) + 1);
    }

    if (commandWords[currentIndex++] !== 'где') {
        syntaxError(queryArray.indexOf(command) + 1,
            countLengthBeforeMistake(commandWords, currentIndex - 1) + 1);
    }

    if (commandWords[currentIndex++] !== 'есть') {
        syntaxError(queryArray.indexOf(command) + 1,
            countLengthBeforeMistake(commandWords, currentIndex - 1) + 1);
    }

    return showContactsInfoByRequest(commandWords.slice(currentIndex).join(' '), fields);
}

function parseMistake(queryArray, command) {
    if (queryArray.indexOf(command) + 1 !== queryArray.length || command !== '') {
        syntaxError(queryArray.indexOf(command) + 1, 1);
    }
}

function parseCommands(commandWords, queryArray, command) {
    let result;

    switch (commandWords[0]) {
        case 'Создай':
            parseCreateCommand(commandWords, queryArray, command);
            break;
        case 'Удали':
            parseDeleteCommands(commandWords, queryArray, command);
            break;
        case 'Добавь':
            parseAddCommand(commandWords, queryArray, command);
            break;
        case 'Покажи':
            result = parseShowCommand(commandWords, queryArray, command);
            break;
        default:
            parseMistake(queryArray, command);
    }

    return result;
}

/**
 * Выполнение запроса на языке pbQL
 * @param {string} query
 * @returns {string[]} - строки с результатами запроса
 */
function run(query) {
    const queryArray = query.split(';');
    let result = [];

    for (const command of queryArray) {
        const commandWords = command.split(' ');

        let parseCommandResult = parseCommands(commandWords, queryArray, command);

        if (typeof parseCommandResult !== 'undefined') {
            result = result.concat(parseCommandResult);
        }
    }

    if (queryArray[queryArray.length - 1] !== '') {
        syntaxError(queryArray.length, queryArray[queryArray.length - 1].length + 1);
    }

    return result;
}

module.exports = { phoneBook, run };

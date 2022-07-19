import { Transition } from '@headlessui/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/outline';
import { AppContent } from '@ui/old_components/AppContent';
import { AppTitle } from '@ui/old_components/AppTitle';
import { AppWrapper } from '@ui/old_components/AppWrapper';
import { Button } from '@ui/old_components/Button';
import { ItemIcon } from '@ui/old_components/ItemIcon';
import React from 'react';

import { List } from './List';
import { ListItem } from './ListItem';

export interface IContextMenuOption {
    onClick(e, option): void;

    label: string;
    description?: string;
    selected?: boolean;
    icon?: JSX.Element;
    key?: string;
}

interface ContextMenuProps {
    open: boolean;
    onClose: () => void;
    options: Array<IContextMenuOption>;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ open, onClose, options }) => {
    return (
        <Transition
            appear={true}
            show={open}
            className="absolute inset-x-0 z-40"
            enter="transition ease-in-out duration-300 transform"
            enterFrom="translate-x-full"
            enterTo="translate-x-0"
            leave="transition ease-in-out duration-300 transform"
            leaveFrom="translate-x-0"
            leaveTo="translate-x-full"
        >
            <AppWrapper>
                <AppTitle title="Configuration" isBigHeader={false}>
                    {onClose && (
                        <Button className="flex items-center text-base" onClick={onClose}>
                            <ChevronLeftIcon className="h-5 w-5" />
                            Fermer
                        </Button>
                    )}
                </AppTitle>
                <AppContent className="mt-10 mb-4">
                    <List>
                        {options.map(option => (
                            <ListItem
                                selected={option.selected}
                                key={option.key || option.label}
                                button
                                onClick={e => {
                                    option.onClick(e, option);
                                    onClose();
                                }}
                            >
                                <ItemIcon color="transparent" icon={option.icon} />
                                <p className="flex-grow ml-4 font-light normal-case">{option.label}</p>
                                <Button className="flex items-center">
                                    <ChevronRightIcon className="text-white text-opacity-25 w-5 h-5" />
                                </Button>
                            </ListItem>
                        ))}
                    </List>
                </AppContent>
            </AppWrapper>
        </Transition>
    );
};
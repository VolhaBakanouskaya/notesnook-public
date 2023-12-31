/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import React from "react";
import { Flex, Text } from "@theme-ui/components";
import ListItem from "../list-item";
import { useStore, store } from "../../stores/notebook-store";
import { store as appStore } from "../../stores/app-store";
import { showUnpinnedToast } from "../../common/toasts";
import { db } from "../../common/db";
import {
  Topic,
  PinFilled,
  NotebookEdit,
  Notebook as NotebookIcon,
  Pin,
  RemoveShortcutLink,
  Shortcut,
  Trash
} from "../icons";
import { hashNavigate, navigate } from "../../navigation";
import IconTag from "../icon-tag";
import { showToast } from "../../utils/toast";
import { Multiselect } from "../../common/multi-select";
import { pluralize } from "@notesnook/common";
import { confirm } from "../../common/dialog-controller";
import { getFormattedDate } from "@notesnook/common";

function Notebook(props) {
  const { item, index, totalNotes, date, simplified } = props;
  const notebook = item;
  const isCompact = useStore((store) => store.viewMode === "compact");

  return (
    <ListItem
      selectable
      isCompact={isCompact}
      isSimple={simplified}
      item={notebook}
      onClick={() => {
        navigate(`/notebooks/${notebook.id}`);
      }}
      title={notebook.title}
      body={notebook.description}
      index={index}
      menu={{ items: menuItems, extraData: { notebook } }}
      footer={
        isCompact ? (
          <>
            <Text sx={{ fontSize: "subBody", color: "fontTertiary" }}>
              {pluralize(totalNotes, "note")}
            </Text>
          </>
        ) : (
          <>
            {notebook?.topics && (
              <Flex mb={1} sx={{ gap: 1 }}>
                {notebook?.topics.slice(0, 3).map((topic) => (
                  <IconTag
                    key={topic.id}
                    text={topic.title}
                    icon={Topic}
                    onClick={() => {
                      navigate(`/notebooks/${notebook.id}/${topic.id}`);
                    }}
                  />
                ))}
              </Flex>
            )}
            <Flex
              sx={{
                fontSize: "subBody",
                color: "fontTertiary",
                alignItems: "center",
                fontFamily: "body"
              }}
            >
              {notebook.pinned && (
                <PinFilled color="primary" size={13} sx={{ mr: 1 }} />
              )}

              {getFormattedDate(date, "date")}
              <Text as="span" mx={1} sx={{ color: "inherit" }}>
                •
              </Text>
              <Text sx={{ color: "inherit" }}>
                {pluralize(totalNotes, "note")}
              </Text>
            </Flex>
          </>
        )
      }
    />
  );
}
export default React.memo(Notebook, (prev, next) => {
  const prevItem = prev.item;
  const nextItem = next.item;

  return (
    prev.date === next.date &&
    prevItem.pinned === nextItem.pinned &&
    prevItem.title === nextItem.title &&
    prevItem.description === nextItem.description &&
    prevItem.topics.length === nextItem.topics.length &&
    prev.totalNotes === next.totalNotes
  );
});

const pin = (notebook) => {
  return store
    .pin(notebook.id)
    .then(() => {
      if (notebook.pinned) showUnpinnedToast(notebook.id, "notebook");
    })
    .catch((error) => showToast("error", error.message));
};

const menuItems = [
  {
    key: "edit",
    title: "Edit",
    icon: NotebookEdit,
    onClick: ({ notebook }) => hashNavigate(`/notebooks/${notebook.id}/edit`)
  },
  {
    key: "set-as-default",
    title: "Set as default",
    checked: ({ notebook }) => {
      const defaultNotebook = db.settings.getDefaultNotebook();
      return defaultNotebook?.id === notebook.id && !defaultNotebook?.topic;
    },

    icon: NotebookIcon,
    onClick: async ({ notebook }) => {
      const defaultNotebook = db.settings.getDefaultNotebook();
      const isDefault =
        defaultNotebook?.id === notebook.id && !defaultNotebook?.topic;

      await db.settings.setDefaultNotebook(
        isDefault ? undefined : { id: notebook.id }
      );
    }
  },
  {
    key: "pin",
    icon: Pin,
    title: "Pin",
    checked: ({ notebook }) => notebook.pinned,
    onClick: ({ notebook }) => pin(notebook)
  },
  {
    key: "shortcut",
    icon: ({ notebook }) =>
      db.shortcuts.exists(notebook.id) ? RemoveShortcutLink : Shortcut,
    title: ({ notebook }) =>
      db.shortcuts.exists(notebook.id) ? "Remove shortcut" : "Create shortcut",
    onClick: ({ notebook }) => appStore.addToShortcuts(notebook)
  },
  { key: "sep", type: "separator" },
  {
    key: "movetotrash",
    title: "Move to trash",
    color: "error",
    iconColor: "error",
    icon: Trash,
    onClick: async ({ items }) => {
      const result = await confirm({
        title: `Delete ${pluralize(items.length, "notebook")}?`,
        positiveButtonText: `Yes`,
        negativeButtonText: "No",
        checks: {
          deleteContainingNotes: {
            text: `Move all notes in ${
              items.length > 1 ? "these notebooks" : "this notebook"
            } to trash`
          }
        }
      });

      if (result) {
        if (result.deleteContainingNotes) {
          const notes = [];
          for (const item of items) {
            notes.push(...db.relations.from(item, "note"));
            const topics = db.notebooks.notebook(item.id).topics;
            for (const topic of topics.all) {
              notes.push(...topics.topic(topic.id).all);
            }
          }
          await Multiselect.moveNotesToTrash(notes, false);
        }
        await Multiselect.moveNotebooksToTrash(items);
      }
    },
    multiSelect: true
  }
];

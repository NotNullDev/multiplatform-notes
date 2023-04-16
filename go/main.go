package main

import (
	"time"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

const (
	// TODO: get from jwks endpoint
	kcPublicKey = `MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAnWjlNuZ4QeJT0QQ3ESH43azhbygSp2QnKn/jis0cm1F8/0FjK8maPnd0/8Dx7dHqQQ5FVvYNa8U15BpgKsS1N0FAKGEMihjgbYO8BDt9uV0ghwYJcVksKvo+b+/8W9u+5yFGtFBs2ivLxBUUgaT5Y8Ne/ZOkvmbYKgkhqSYd0xvTGJfX0oZWTqqFog96eCgVi5t/yYbZtL72nHtCDtzZLFutz6bND19i8PDCfNf8Bnq1f3SMvDvKDLnl7Qk5goh6sd88YXO+Kt/zuSRPcKIL5VMPWPGmEwjOJI3MqS65ELGXoUICcZtWzkS/3mj+ErNky9yQovzIPGkK545+bN3mkQIDAQAB`
)

var (
	db *gorm.DB
)

type Note struct {
	NoteId      string     `gorm:"primary_key" json:"noteId"`
	UserId      string     `json:"userId"`
	NoteTitle   string     `json:"noteTitle"`
	NoteContent string     `json:"noteContent"`
	CreatedAt   *time.Time `json:"createdAt"`
}

func main() {
	db, err := gorm.Open(sqlite.Open("./db.sqlite"), &gorm.Config{})

	if err != nil {
		panic(err.Error())
	}

	db.AutoMigrate(&Note{})

	e := echo.New()
	e.Use(middleware.CORS())
	e.GET("/notes", func(c echo.Context) error {
		var notes []Note
		tx := db.Find(&notes)

		if tx.Error != nil {
			return c.JSON(400, tx.Error.Error()) // TODO
		}

		return c.JSON(200, notes)
	})

	e.POST("/notes", func(c echo.Context) error {
		var note Note

		err := c.Bind(&note)

		if err != nil {
			return c.JSON(400, err.Error()) // TODO
		}

		id := uuid.NewString()
		note.NoteId = id

		tx := db.Create(&note)

		if tx.Error != nil {
			return c.JSON(400, tx.Error.Error()) // TODO
		}

		return c.JSON(201, note)
	})

	e.DELETE("/notes/:id", func(c echo.Context) error {
		id := c.Param("id")

		if id == "" {
			return c.JSON(400, "id is required")
		}

		tx := db.Delete(&Note{
			NoteId: id,
		})

		if tx.RowsAffected == 0 {
			return c.JSON(400, "note not found")
		}

		if tx.Error != nil {
			return c.JSON(400, tx.Error.Error()) // TODO
		}

		return c.NoContent(204)
	})

	err = e.Start(":7777")

	if err != nil {
		panic(err.Error())
	}
}
